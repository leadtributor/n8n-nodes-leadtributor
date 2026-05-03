import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ResourceModule } from './types';

// ── Description ───────────────────────────────────────────────────────────────

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['salesPartner'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a sales partner (only allowed when ENDED, PENDING or DECLINED)',
				action: 'Delete a sales partner',
			},
			{
				name: 'End',
				value: 'end',
				description: 'End an active sales partner relationship',
				action: 'End a sales partner relationship',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a sales partner by ID',
				action: 'Get a sales partner',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'List sales partners',
				action: 'Get many sales partners',
			},
			{
				name: 'Invite',
				value: 'invite',
				description: 'Send an email invitation to a potential sales partner',
				action: 'Invite a sales partner',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update tags and attributes of a sales partner',
				action: 'Update a sales partner',
			},
		],
		default: 'getMany',
	},

	// ── salesPartnerId (get, update, end, delete) ─────────────────────────────
	{
		displayName: 'Sales Partner ID',
		name: 'salesPartnerId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the sales partner (UUID)',
		displayOptions: {
			show: {
				resource: ['salesPartner'],
				operation: ['get', 'update', 'end', 'delete'],
			},
		},
	},

	// ── invite ────────────────────────────────────────────────────────────────
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'partner@example.com',
		description: 'Email address of the person to invite',
		displayOptions: { show: { resource: ['salesPartner'], operation: ['invite'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['salesPartner'], operation: ['invite'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the partner company or contact person',
			},
			{
				displayName: 'Invitation Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Personal invitation message',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'json',
				default: '[]',
				description: 'Tags to assign to the partner as a JSON array, e.g. ["vip","region-west"]',
			},
			{
				displayName: 'Attributes',
				name: 'attributes',
				type: 'json',
				default: '{}',
				description: 'Custom key-value attributes as a JSON object, e.g. {"region":"Bavaria"}',
			},
		],
	},

	// ── getMany ───────────────────────────────────────────────────────────────
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['salesPartner'], operation: ['getMany'] } },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: ['ACTIVE', 'PENDING:INVITED'],
				description: 'Filter by partner status. Defaults to ACTIVE and PENDING:INVITED.',
				options: [
					{ name: 'Active', value: 'ACTIVE' },
					{ name: 'Pending (Invited)', value: 'PENDING:INVITED' },
					{ name: 'Ended', value: 'ENDED' },
				],
			},
		],
	},

	// ── update ────────────────────────────────────────────────────────────────
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: ['salesPartner'], operation: ['update'] } },
		options: [
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'json',
				default: '[]',
				description: 'Tags to set on the partner as a JSON array, e.g. ["vip","region-west"]. Replaces existing tags.',
			},
			{
				displayName: 'Attributes',
				name: 'attributes',
				type: 'json',
				default: '{}',
				description: 'Custom key-value attributes as a JSON object, e.g. {"region":"Bavaria"}. Replaces existing attributes.',
			},
		],
	},

	// ── x-serial (update, end, delete) ───────────────────────────────────────
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['salesPartner'],
				operation: ['update', 'end', 'delete'],
			},
		},
		options: [
			{
				displayName: 'Serial',
				name: 'serial',
				type: 'number',
				default: 0,
				description: 'Current serial number for optimistic locking. Leave at 0 to skip the check.',
			},
		],
	},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractApiError(error: unknown): string {
	const e = error as { context?: { data?: unknown }; description?: unknown; message?: unknown };
	if (e?.context?.data && typeof e?.description === 'string') return e.description;
	return typeof e?.message === 'string' ? e.message : 'Unknown error';
}

// ── Execute ───────────────────────────────────────────────────────────────────

async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	baseUrl: string,
): Promise<unknown> {
	if (operation === 'invite') {
		const email = this.getNodeParameter('email', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		const body: IDataObject = { email };
		if (additionalFields.name) body.name = additionalFields.name;
		if (additionalFields.text) body.text = additionalFields.text;
		if (additionalFields.tags) body.tags = JSON.parse(additionalFields.tags as string);
		if (additionalFields.attributes) body.attributes = JSON.parse(additionalFields.attributes as string);

		try {
			return await this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
				method: 'POST',
				url: `${baseUrl}/sales-partners`,
				body,
				json: true,
			});
		} catch (error) {
			throw new NodeOperationError(this.getNode(), extractApiError(error), { itemIndex: i });
		}
	}

	if (operation === 'get') {
		const salesPartnerId = this.getNodeParameter('salesPartnerId', i) as string;
		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'GET',
			url: `${baseUrl}/sales-partners/${encodeURIComponent(salesPartnerId)}`,
			json: true,
		});
	}

	if (operation === 'getMany') {
		const filters = this.getNodeParameter('filters', i) as IDataObject;
		const statusValues = (filters.status as string[] | undefined) ?? ['ACTIVE', 'PENDING:INVITED'];
		const queryString = statusValues.map((s) => `status=${encodeURIComponent(s)}`).join('&');

		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'GET',
			url: `${baseUrl}/sales-partners?${queryString}`,
			json: true,
		});
	}

	if (operation === 'update') {
		const salesPartnerId = this.getNodeParameter('salesPartnerId', i) as string;
		const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
		const options = this.getNodeParameter('options', i) as IDataObject;

		const body: IDataObject = {};
		if (updateFields.tags !== undefined) body.tags = JSON.parse(updateFields.tags as string);
		if (updateFields.attributes !== undefined) body.attributes = JSON.parse(updateFields.attributes as string);

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(this.getNode(), "At least one of 'tags' or 'attributes' must be provided.", { itemIndex: i });
		}

		const headers: IDataObject = {};
		if (options.serial) headers['x-serial'] = String(options.serial);

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
				method: 'PATCH',
				url: `${baseUrl}/sales-partners/${encodeURIComponent(salesPartnerId)}`,
				body,
				headers,
				json: true,
			});
		} catch (error) {
			throw new NodeOperationError(this.getNode(), extractApiError(error), { itemIndex: i });
		}
		return { success: true, salesPartnerId };
	}

	if (operation === 'end') {
		const salesPartnerId = this.getNodeParameter('salesPartnerId', i) as string;
		const options = this.getNodeParameter('options', i) as IDataObject;

		const headers: IDataObject = {};
		if (options.serial) headers['x-serial'] = String(options.serial);

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
				method: 'POST',
				url: `${baseUrl}/sales-partners/${encodeURIComponent(salesPartnerId)}/end`,
				body: {},
				headers,
				json: true,
			});
		} catch (error) {
			throw new NodeOperationError(this.getNode(), extractApiError(error), { itemIndex: i });
		}
		return { success: true, salesPartnerId };
	}

	if (operation === 'delete') {
		const salesPartnerId = this.getNodeParameter('salesPartnerId', i) as string;
		const options = this.getNodeParameter('options', i) as IDataObject;

		const headers: IDataObject = {};
		if (options.serial) headers['x-serial'] = String(options.serial);

		try {
			await this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
				method: 'DELETE',
				url: `${baseUrl}/sales-partners/${encodeURIComponent(salesPartnerId)}`,
				headers,
				json: true,
			});
		} catch (error) {
			throw new NodeOperationError(this.getNode(), extractApiError(error), { itemIndex: i });
		}
		return { success: true, salesPartnerId };
	}

	throw new NodeOperationError(this.getNode(), `Unknown sales partner operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Sales Partner', description, execute } satisfies ResourceModule;
