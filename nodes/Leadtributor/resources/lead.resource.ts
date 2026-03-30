import type {
	IExecuteFunctions,
	INodeProperties,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ResourceModule } from './types';

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
		],
		default: 'getMany',
	},
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
				operation: ['get', 'update'],
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
				operation: ['create', 'update'],
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
				operation: ['create', 'update'],
			},
		},
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['lead'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Prospect Field Order',
				name: 'prospectFieldOrder',
				type: 'string',
				default: '',
				description: 'Comma-separated list of prospect field names in the desired display order',
				placeholder: 'Anrede,Vorname,Nachname,Anschrift',
			},
			{
				displayName: 'Interest Field Order',
				name: 'interestFieldOrder',
				type: 'string',
				default: '',
				description: 'Comma-separated list of interest field names in the desired display order',
			},
		],
	},
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

async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	baseUrl: string,
): Promise<unknown> {
	if (operation === 'create') {
		const prospectFields = this.getNodeParameter('prospectFields', i) as IDataObject;
		const interestFields = this.getNodeParameter('interestFields', i) as IDataObject;
		const additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;

		const body: IDataObject = {
			prospect: { fields: prospectFields },
			interest: { fields: interestFields },
		};

		if (additionalOptions.prospectFieldOrder) {
			(body.prospect as IDataObject).fieldOrder = (
				additionalOptions.prospectFieldOrder as string
			)
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		}
		if (additionalOptions.interestFieldOrder) {
			(body.interest as IDataObject).fieldOrder = (
				additionalOptions.interestFieldOrder as string
			)
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		}

		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'POST',
			url: `${baseUrl}/leads`,
			body,
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

	throw new NodeOperationError(this.getNode(), `Unknown lead operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Lead', description, execute } satisfies ResourceModule;
