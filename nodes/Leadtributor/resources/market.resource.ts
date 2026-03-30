import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ResourceModule } from './types';

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['market'] } },
		options: [
			{
				name: 'Offer Lead',
				value: 'offerLead',
				description: 'Offer a lead on a market for distribution to sales partners',
				action: 'Offer a lead on a market',
			},
		],
		default: 'offerLead',
	},
	{
		displayName: 'Lead ID',
		name: 'leadId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the lead to offer on the market',
		displayOptions: {
			show: {
				resource: ['market'],
				operation: ['offerLead'],
			},
		},
	},
	{
		displayName: 'Market ID',
		name: 'marketId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique ID of the market on which to offer the lead',
		displayOptions: {
			show: {
				resource: ['market'],
				operation: ['offerLead'],
			},
		},
	},
];

async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	baseUrl: string,
): Promise<unknown> {
	if (operation === 'offerLead') {
		const marketId = this.getNodeParameter('marketId', i) as string;
		const leadId = this.getNodeParameter('leadId', i) as string;

		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'POST',
			url: `${baseUrl}/markets/${encodeURIComponent(marketId)}/brokerages`,
			body: { leadId },
			json: true,
		});
	}

	throw new NodeOperationError(this.getNode(), `Unknown market operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Market', description, execute } satisfies ResourceModule;
