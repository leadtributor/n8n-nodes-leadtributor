import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeProperties,
	INodePropertyOptions,
	IDataObject,
	IHttpRequestOptions,
	ResourceMapperFields,
	ResourceMapperField,
	FieldType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ResourceModule } from './types';

// ── Internal types for the Leadtributor form API ──────────────────────────────

interface LtFormField {
	type: string;
	value: unknown;
	items?: string[];
	multiSelectAllowed?: boolean;
}

interface LtFormSection {
	fields: Record<string, LtFormField>;
	required: string[];
	fieldOrder: string[];
}

interface LtForm {
	id: string;
	name: string;
	definition: {
		prospect: LtFormSection;
		interest: LtFormSection;
	};
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formCache = new WeakMap<ILoadOptionsFunctions | IExecuteFunctions, LtForm>();

async function fetchFirstForm(context: ILoadOptionsFunctions | IExecuteFunctions, baseUrl: string): Promise<LtForm> {
	const cached = formCache.get(context);
	if (cached) return cached;

	const forms = (await context.helpers.httpRequestWithAuthentication.call(
		context,
		'leadtributorApi',
		{ method: 'GET', url: `${baseUrl}/forms`, json: true },
	)) as LtForm[];
	if (!forms.length) {
		throw new Error('No forms found in your Leadtributor account.');
	}
	formCache.set(context, forms[0]);
	return forms[0];
}

function toResourceMapperField(
	name: string,
	field: LtFormField,
	required: string[],
): ResourceMapperField {
	let type: FieldType = 'string';
	let options: INodePropertyOptions[] | undefined;

	if (field.type.startsWith('bool:')) {
		type = 'boolean';
	} else if (field.type.startsWith('number:')) {
		type = 'number';
	} else if (field.type === 'text:list' && !field.multiSelectAllowed && field.items) {
		type = 'options';
		options = field.items.map((item) => ({ name: item, value: item }));
	}

	return {
		id: name,
		displayName: name,
		required: required.includes(name),
		defaultMatch: false,
		display: true,
		type,
		...(options ? { options } : {}),
	};
}

function sectionToResourceMapperFields(section: LtFormSection): ResourceMapperFields {
	return {
		fields: section.fieldOrder
			.filter((name) => name in section.fields)
			.map((name) => toResourceMapperField(name, section.fields[name], section.required)),
	};
}

function buildSectionPayload(
	mapperValue: IDataObject,
	section: LtFormSection,
): { fields: Record<string, { type: string; value: unknown }>; fieldOrder: string[] } {
	const fields: Record<string, { type: string; value: unknown }> = {};

	for (const [key, rawValue] of Object.entries(mapperValue)) {
		if (rawValue === null || rawValue === undefined) continue;
		const fieldDef = section.fields[key];
		if (!fieldDef) continue;

		let value: unknown = rawValue, type: string = fieldDef.type;
		if (fieldDef.type === 'number:natural') {
			value = Number(rawValue)?.toString();
		}
		// Multi-select lists are entered as comma-separated strings → convert to array
		if (fieldDef.type === 'text:list' && typeof rawValue === 'string') {
			if (fieldDef.multiSelectAllowed) {
				value = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
			} else {
				type = 'text:singleline';
			}
		}

		fields[key] = { type, value };
	}

	const fieldOrder = section.fieldOrder.filter((key) => key in fields);
	return { fields, fieldOrder };
}

// ── Description ───────────────────────────────────────────────────────────────

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['lead'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new lead',
				action: 'Create a lead',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a lead by ID',
				action: 'Get a lead',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'List leads with optional filters',
				action: 'Get many leads',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update the field lists of a lead',
				action: 'Update a lead',
			},
			{
				name: 'Assign to Sales Partner',
				value: 'assignToSalesPartner',
				description: 'Directly assign a lead to a sales partner',
				action: 'Assign a lead to a sales partner',
			},
		],
		default: 'getMany',
	},

	// ── create ────────────────────────────────────────────────────────────────
	{
		displayName: 'Prospect Fields',
		name: 'prospectMapper',
		type: 'resourceMapper',
		default: { mappingMode: 'defineBelow', value: null },
		displayOptions: { show: { resource: ['lead'], operation: ['create'] } },
		typeOptions: {
			resourceMapper: {
				resourceMapperMethod: 'getProspectFields',
				mode: 'add',
				fieldWords: { singular: 'Prospect Field', plural: 'Prospect Fields' },
				addAllFields: false,
				noFieldsError: 'No form found. Ensure your Leadtributor account has at least one form configured.',
			},
		},
	},
	{
		displayName: 'Interest Fields',
		name: 'interestMapper',
		type: 'resourceMapper',
		default: { mappingMode: 'defineBelow', value: null },
		displayOptions: { show: { resource: ['lead'], operation: ['create'] } },
		typeOptions: {
			resourceMapper: {
				resourceMapperMethod: 'getInterestFields',
				mode: 'add',
				fieldWords: { singular: 'Interest Field', plural: 'Interest Fields' },
				addAllFields: false,
				noFieldsError: 'No form found. Ensure your Leadtributor account has at least one form configured.',
			},
		},
	},

	// ── get / update / assignToSalesPartner ──────────────────────────────────
	{
		displayName: 'Lead ID',
		name: 'leadId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the lead (UUID)',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['get', 'update', 'assignToSalesPartner'],
			},
		},
	},
	{
		displayName: 'Prospect Fields',
		name: 'prospectFields',
		type: 'json',
		default: '{}',
		description:
			'Fields describing the contact person or company. Each key is a field name; each value is an object with "type" and "value". Example: {"Vorname": {"type": "text:singleline:firstname", "value": "Max"}}',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['update'],
			},
		},
	},
	{
		displayName: 'Interest Fields',
		name: 'interestFields',
		type: 'json',
		default: '{}',
		description:
			'Fields describing the prospect\'s interest or request. Each key is a field name; each value is an object with "type" and "value". Example: {"Anfrage": {"type": "text:multiline", "value": "Bitte um Angebot"}}',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['update'],
			},
		},
	},

	// ── assignToSalesPartner ─────────────────────────────────────────────────
	{
		displayName: 'Sales Partner ID',
		name: 'salesPartnerId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the sales partner to assign the lead to',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['assignToSalesPartner'],
			},
		},
	},
	{
		displayName: 'Sales Pipeline ID',
		name: 'salesPipelineId',
		type: 'string',
		default: '',
		description: 'Optional ID of the sales pipeline to use for this assignment',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['assignToSalesPartner'],
			},
		},
	},

	// ── getMany ───────────────────────────────────────────────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description:
			'Whether to fetch all pages of results automatically. When disabled, only one page is returned.',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['getMany'],
			},
		},
	},
	{
		displayName: 'Max Results',
		name: 'maxResults',
		type: 'number',
		default: 100,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Maximum number of leads to return per page (1–100)',
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Include Field Lists',
				name: 'includeFieldLists',
				type: 'boolean',
				default: false,
				description: 'Whether to include prospect and interest field lists in each returned lead',
			},
			{
				displayName: 'Modified At',
				name: 'modifiedAt',
				type: 'string',
				default: '',
				placeholder: 'gte:2024-01-01',
				description:
					'Filter leads by last-modified date. Prefix with an operator: gte:, gt:, lte:, lt:, or eq: (default). Example: gte:2024-01-01',
			},
			{
				displayName: 'Lead Created At',
				name: 'leadCreatedAt',
				type: 'string',
				default: '',
				placeholder: 'gte:2024-01-01',
				description: 'Filter by lead creation date. Prefix with an operator: gte:, gt:, lte:, lt:, or eq:',
			},
			{
				displayName: 'Commission Responsible',
				name: 'commissionResponsible',
				type: 'string',
				default: '',
				description: 'Filter by the URN of the sales partner responsible for the commission',
				placeholder: 'urn:lt:sales-partners:sales-partner:740fc051-24eb-4a6a-b345-b8305c097269',
			},
			{
				displayName: 'Commission Step Name',
				name: 'commissionStepName',
				type: 'string',
				default: '',
				description: 'Filter by the current pipeline step name of the commission',
				placeholder: 'Contact',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '',
				placeholder: '-modifiedAt',
				description:
					'Sort field(s), comma-separated. Prefix with - for descending or + for ascending. Supported: modifiedAt, lead.leadId, lead.createdAt, lead.modifiedAt, commission.startedAt',
			},
		],
	},
];

// ── Methods ───────────────────────────────────────────────────────────────────

const methods = {
	resourceMapping: {
		async getProspectFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
			const credentials = await this.getCredentials('leadtributorApi');
			const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
			const form = await fetchFirstForm(this, baseUrl);
			return sectionToResourceMapperFields(form.definition.prospect);
		},
		async getInterestFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
			const credentials = await this.getCredentials('leadtributorApi');
			const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
			const form = await fetchFirstForm(this, baseUrl);
			return sectionToResourceMapperFields(form.definition.interest);
		},
	},
};

// ── Execute ───────────────────────────────────────────────────────────────────

async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	baseUrl: string,
): Promise<unknown> {
	if (operation === 'create') {
		const prospectMapper = this.getNodeParameter('prospectMapper', i) as IDataObject;
		const interestMapper = this.getNodeParameter('interestMapper', i) as IDataObject;

		const form = await fetchFirstForm(this, baseUrl);

		const prospect = buildSectionPayload(
			(prospectMapper.value ?? {}) as IDataObject,
			form.definition.prospect,
		);
		const interest = buildSectionPayload(
			(interestMapper.value ?? {}) as IDataObject,
			form.definition.interest,
		);

		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'POST',
			url: `${baseUrl}/leads`,
			body: { prospect, interest },
			json: true,
		});
	}

	if (operation === 'get') {
		const leadId = this.getNodeParameter('leadId', i) as string;
		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'GET',
			url: `${baseUrl}/leads/${encodeURIComponent(leadId)}`,
			json: true,
		});
	}

	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;

		const qs: IDataObject = {};
		if (filters.includeFieldLists) qs.includeFieldLists = true;
		if (filters.modifiedAt) qs.modifiedAt = filters.modifiedAt;
		if (filters.leadCreatedAt) qs['lead.createdAt'] = filters.leadCreatedAt;
		if (filters.commissionResponsible) qs['commission.responsible'] = filters.commissionResponsible;
		if (filters.commissionStepName) qs['commission.stepName'] = filters.commissionStepName;
		if (filters.sort) qs.sort = filters.sort;

		const allResults: IDataObject[] = [];
		let continuation: string | undefined;

		do {
			const pageQs: IDataObject = { ...qs };
			if (!returnAll) {
				pageQs.maxResults = this.getNodeParameter('maxResults', i) as number;
			}
			if (continuation) pageQs.continuation = continuation;

			const pageOptions: IHttpRequestOptions = {
				method: 'GET',
				url: `${baseUrl}/leads`,
				qs: pageQs,
				json: true,
				returnFullResponse: true,
			};

			const response = (await this.helpers.httpRequestWithAuthentication.call(
				this,
				'leadtributorApi',
				pageOptions,
			)) as { body: IDataObject[]; headers: Record<string, string> };

			const pageData = Array.isArray(response.body) ? response.body : [];
			allResults.push(...pageData);
			continuation = response.headers['X-Continuation'];

			if (!returnAll) break;
		} while (continuation);

		return allResults;
	}

	if (operation === 'update') {
		const leadId = this.getNodeParameter('leadId', i) as string;
		const prospectFields = this.getNodeParameter('prospectFields', i) as IDataObject;
		const interestFields = this.getNodeParameter('interestFields', i) as IDataObject;

		const body: IDataObject = {};
		if (Object.keys(prospectFields).length > 0) {
			body.prospect = { fields: prospectFields };
		}
		if (Object.keys(interestFields).length > 0) {
			body.interest = { fields: interestFields };
		}

		// PATCH /leads/{leadId} returns 204 No Content on success
		await this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'PATCH',
			url: `${baseUrl}/leads/${encodeURIComponent(leadId)}`,
			body,
			json: true,
		});
		return { success: true, leadId };
	}

	if (operation === 'assignToSalesPartner') {
		const leadId = this.getNodeParameter('leadId', i) as string;
		const salesPartnerId = this.getNodeParameter('salesPartnerId', i) as string;
		const salesPipelineId = this.getNodeParameter('salesPipelineId', i) as string;

		const body: IDataObject = { salesPartnerId };
		if (salesPipelineId) body.salesPipelineId = salesPipelineId;

		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'POST',
			url: `${baseUrl}/leads/${encodeURIComponent(leadId)}/commissions`,
			body,
			json: true,
		});
	}

	throw new NodeOperationError(this.getNode(), `Unknown lead operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Lead', description, methods, execute } satisfies ResourceModule;
