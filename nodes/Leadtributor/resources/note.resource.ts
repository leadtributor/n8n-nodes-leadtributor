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
		displayOptions: { show: { resource: ['note'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'List notes across all leads',
				action: 'Get many notes',
			},
			{
				name: 'Get Many for Lead',
				value: 'getManyByLead',
				description: 'List notes of a specific lead',
				action: 'Get many notes for a lead',
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
		description: 'The unique ID of the lead whose notes to list',
		displayOptions: {
			show: {
				resource: ['note'],
				operation: ['getManyByLead'],
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to fetch all pages of results automatically',
		displayOptions: {
			show: {
				resource: ['note'],
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
		description: 'Maximum number of notes to return per page (1–100)',
		displayOptions: {
			show: {
				resource: ['note'],
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
				resource: ['note'],
				operation: ['getMany'],
			},
		},
		options: [
			{
				displayName: 'Modified Since',
				name: 'modifiedSince',
				type: 'dateTime',
				default: '',
				description: 'Return only notes modified at or after this date/time',
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
	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', i) as boolean;
		const filters = this.getNodeParameter('filters', i) as IDataObject;

		const qs: IDataObject = {};
		if (filters.modifiedSince) qs.modifiedSince = filters.modifiedSince;

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
				url: `${baseUrl}/notes`,
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

	if (operation === 'getManyByLead') {
		const leadId = this.getNodeParameter('leadId', i) as string;
		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'GET',
			url: `${baseUrl}/leads/${encodeURIComponent(leadId)}/notes`,
			json: true,
		});
	}

	throw new NodeOperationError(this.getNode(), `Unknown note operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Note', description, execute } satisfies ResourceModule;
