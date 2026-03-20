import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { JsonObject } from 'n8n-workflow';

export class Leadtributor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Leadtributor',
		name: 'leadtributor',
		icon: 'file:leadtributor.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Leadtributor.cloud API for lead management',
		defaults: { name: 'Leadtributor' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'leadtributorApi', required: true }],
		properties: [
			// ── RESOURCE ──────────────────────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Form', value: 'form' },
					{ name: 'Lead', value: 'lead' },
					{ name: 'Market', value: 'market' },
					{ name: 'Note', value: 'note' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'lead',
			},

			// ── LEAD OPERATIONS ───────────────────────────────────────────────
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
						name: 'Modify',
						value: 'modify',
						description: 'Modify the field lists of a lead',
						action: 'Modify a lead',
					},
				],
				default: 'getMany',
			},

			// ── FORM OPERATIONS ───────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['form'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List all forms defined by your company',
						action: 'Get many forms',
					},
				],
				default: 'getMany',
			},

			// ── MARKET OPERATIONS ─────────────────────────────────────────────
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

			// ── NOTE OPERATIONS ───────────────────────────────────────────────
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
						name: 'Get Many by Lead',
						value: 'getManyByLead',
						description: 'List notes of a specific lead',
						action: 'Get many notes by lead',
					},
				],
				default: 'getMany',
			},

			// ── WEBHOOK OPERATIONS ────────────────────────────────────────────
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
						description: 'Cancel a webhook subscription by hook ID',
						action: 'Unsubscribe from a webhook',
					},
				],
				default: 'subscribe',
			},

			// ── LEAD ID ───────────────────────────────────────────────────────
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
						operation: ['get', 'modify'],
					},
				},
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

			// ── MARKET ID ─────────────────────────────────────────────────────
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

			// ── LEAD PROSPECT FIELDS (create / modify) ────────────────────────
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
						operation: ['create', 'modify'],
					},
				},
			},

			// ── LEAD INTEREST FIELDS (create / modify) ────────────────────────
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
						operation: ['create', 'modify'],
					},
				},
			},

			// ── CREATE: additional options ─────────────────────────────────────
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
						description:
							'Comma-separated list of prospect field names in the desired display order',
						placeholder: 'Anrede,Vorname,Nachname,Anschrift',
					},
					{
						displayName: 'Interest Field Order',
						name: 'interestFieldOrder',
						type: 'string',
						default: '',
						description:
							'Comma-separated list of interest field names in the desired display order',
					},
				],
			},

			// ── GET MANY leads ────────────────────────────────────────────────
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
						description:
							'Whether to include prospect and interest field lists in each returned lead',
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
						description:
							'Filter by lead creation date. Prefix with an operator: gte:, gt:, lte:, lt:, or eq:',
					},
					{
						displayName: 'Commission Responsible',
						name: 'commissionResponsible',
						type: 'string',
						default: '',
						description: 'Filter by the URN of the sales partner responsible for the commission',
						placeholder:
							'urn:lt:sales-partners:sales-partner:740fc051-24eb-4a6a-b345-b8305c097269',
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

			// ── GET MANY notes ─────────────────────────────────────────────────
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

			// ── WEBHOOK SUBSCRIBE ─────────────────────────────────────────────
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
					{
						name: 'Sales Partner Invitation Accepted',
						value: 'SalesPartnerInvitationAccepted',
					},
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
						description:
							'Optional API key sent when Leadtributor pushes events to your webhook URL',
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

			// ── WEBHOOK UNSUBSCRIBE ───────────────────────────────────────────
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('leadtributorApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: unknown;

				// ── LEAD ──────────────────────────────────────────────────────
				if (resource === 'lead') {
					if (operation === 'create') {
						const prospectFields = this.getNodeParameter('prospectFields', i) as IDataObject;
						const interestFields = this.getNodeParameter('interestFields', i) as IDataObject;
						const additionalOptions = this.getNodeParameter(
							'additionalOptions',
							i,
						) as IDataObject;

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

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{ method: 'POST', url: `${baseUrl}/leads`, body, json: true },
						);
					} else if (operation === 'get') {
						const leadId = this.getNodeParameter('leadId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{
								method: 'GET',
								url: `${baseUrl}/leads/${encodeURIComponent(leadId)}`,
								json: true,
							},
						);
					} else if (operation === 'getMany') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i) as IDataObject;

						const qs: IDataObject = {};
						if (filters.includeFieldLists) qs.includeFieldLists = true;
						if (filters.modifiedAt) qs.modifiedAt = filters.modifiedAt;
						if (filters.leadCreatedAt) qs['lead.createdAt'] = filters.leadCreatedAt;
						if (filters.commissionResponsible)
							qs['commission.responsible'] = filters.commissionResponsible;
						if (filters.commissionStepName)
							qs['commission.stepName'] = filters.commissionStepName;
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
							continuation = response.headers['x-continuation'];

							if (!returnAll) break;
						} while (continuation);

						responseData = allResults;
					} else if (operation === 'modify') {
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
						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{
								method: 'PATCH',
								url: `${baseUrl}/leads/${encodeURIComponent(leadId)}`,
								body,
								json: true,
							},
						);
						responseData = { success: true, leadId };
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown lead operation: ${operation}`,
							{ itemIndex: i },
						);
					}
				}

				// ── MARKET ────────────────────────────────────────────────────
				else if (resource === 'market') {
					if (operation === 'offerLead') {
						const marketId = this.getNodeParameter('marketId', i) as string;
						const leadId = this.getNodeParameter('leadId', i) as string;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{
								method: 'POST',
								url: `${baseUrl}/markets/${encodeURIComponent(marketId)}/brokerages`,
								body: { leadId },
								json: true,
							},
						);
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown market operation: ${operation}`,
							{ itemIndex: i },
						);
					}
				}

				// ── FORM ──────────────────────────────────────────────────────
				else if (resource === 'form') {
					if (operation === 'getMany') {
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{ method: 'GET', url: `${baseUrl}/forms`, json: true },
						);
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown form operation: ${operation}`,
							{ itemIndex: i },
						);
					}
				}

				// ── NOTE ──────────────────────────────────────────────────────
				else if (resource === 'note') {
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
							continuation = response.headers['x-continuation'];

							if (!returnAll) break;
						} while (continuation);

						responseData = allResults;
					} else if (operation === 'getManyByLead') {
						const leadId = this.getNodeParameter('leadId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{
								method: 'GET',
								url: `${baseUrl}/leads/${encodeURIComponent(leadId)}/notes`,
								json: true,
							},
						);
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown note operation: ${operation}`,
							{ itemIndex: i },
						);
					}
				}

				// ── WEBHOOK ───────────────────────────────────────────────────
				else if (resource === 'webhook') {
					if (operation === 'subscribe') {
						const eventName = this.getNodeParameter('eventName', i) as string;
						const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
						const additionalOptions = this.getNodeParameter(
							'additionalOptions',
							i,
						) as IDataObject;

						const body: IDataObject = { url: webhookUrl, eventName };
						if (additionalOptions.apiKey) body.apiKey = additionalOptions.apiKey;
						if (additionalOptions.description) body.description = additionalOptions.description;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{ method: 'POST', url: `${baseUrl}/webhooks`, body, json: true },
						);
					} else if (operation === 'unsubscribe') {
						const hookId = this.getNodeParameter('hookId', i) as string;

						// DELETE /webhooks/{hookId} returns 204 No Content on success
						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'leadtributorApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/webhooks/${encodeURIComponent(hookId)}`,
								json: true,
							},
						);
						responseData = { success: true, hookId };
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unknown webhook operation: ${operation}`,
							{ itemIndex: i },
						);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						Array.isArray(responseData)
							? responseData
							: [responseData as IDataObject],
					),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) throw error;
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
