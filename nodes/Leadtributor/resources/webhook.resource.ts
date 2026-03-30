import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ResourceModule } from './types';

const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webhook'] } },
		options: [
			{
				name: 'Subscribe',
				value: 'subscribe',
				description: 'Subscribe to a webhook event',
				action: 'Subscribe to a webhook event',
			},
			{
				name: 'Unsubscribe',
				value: 'unsubscribe',
				description: 'Unsubscribe from a webhook event by hook ID',
				action: 'Unsubscribe from a webhook',
			},
		],
		default: 'subscribe',
	},
	{
		displayName: 'Event Name',
		name: 'eventName',
		type: 'options',
		required: true,
		default: 'LeadCreated',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['subscribe'],
			},
		},
		options: [
			{ name: 'Brokerage Failed', value: 'BrokerageFailedEvent' },
			{ name: 'Lead Assigned Directly', value: 'LeadAssignedDirectly' },
			{ name: 'Lead Closed', value: 'LeadClosed' },
			{ name: 'Lead Created', value: 'LeadCreated' },
			{ name: 'Lead Deleted', value: 'LeadDeleted' },
			{ name: 'Lead Offer Accepted', value: 'LeadOfferAcceptedEvent' },
			{ name: 'Lead Offer Created', value: 'LeadOfferCreatedEvent' },
			{ name: 'Sales Partner Ended', value: 'SalesPartnerEnded' },
			{ name: 'Sales Partner Invitation Accepted', value: 'SalesPartnerInvitationAccepted' },
		],
		description: 'The event to subscribe to',
	},
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'The URL to which Leadtributor will POST event payloads',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['subscribe'],
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
				resource: ['webhook'],
				operation: ['subscribe'],
			},
		},
		options: [
			{
				displayName: 'API Key',
				name: 'apiKey',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Optional API key sent when Leadtributor pushes events to your webhook URL',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Human-readable description for this webhook subscription',
			},
		],
	},
	{
		displayName: 'Hook ID',
		name: 'hookId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the webhook subscription to delete',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['unsubscribe'],
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
	if (operation === 'subscribe') {
		const eventName = this.getNodeParameter('eventName', i) as string;
		const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
		const additionalOptions = this.getNodeParameter('additionalOptions', i) as IDataObject;

		const body: IDataObject = { url: webhookUrl, eventName };
		if (additionalOptions.apiKey) body.apiKey = additionalOptions.apiKey;
		if (additionalOptions.description) body.description = additionalOptions.description;

		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'POST',
			url: `${baseUrl}/webhooks`,
			body,
			json: true,
		});
	}

	if (operation === 'unsubscribe') {
		const hookId = this.getNodeParameter('hookId', i) as string;

		// DELETE /webhooks/{hookId} returns 204 No Content on success
		await this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'DELETE',
			url: `${baseUrl}/webhooks/${encodeURIComponent(hookId)}`,
			json: true,
		});
		return { success: true, hookId };
	}

	throw new NodeOperationError(this.getNode(), `Unknown webhook operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Webhook', description, execute } satisfies ResourceModule;
