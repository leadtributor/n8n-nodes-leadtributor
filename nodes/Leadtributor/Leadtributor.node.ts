import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
	NodeApiError,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

// TODO: Replace placeholder resources and operations with actual leadtributor API
// endpoints once the documentation at https://developer.leadtributor.cloud is available.

export class Leadtributor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'leadtributor',
		name: 'leadtributor',
		icon: 'file:leadtributor.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the leadtributor.cloud API',
		defaults: {
			name: 'leadtributor',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'leadtributorApi',
				required: true,
			},
		],
		properties: [
			// -------------------------------------------------------
			// Resource selector
			// TODO: Replace with actual resources from leadtributor API
			// -------------------------------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Example Resource',
						value: 'exampleResource',
						description: 'Placeholder – replace with actual leadtributor resource',
					},
				],
				default: 'exampleResource',
			},

			// -------------------------------------------------------
			// Operations for "Example Resource"
			// TODO: Replace with actual operations from leadtributor API
			// -------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['exampleResource'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new record',
						action: 'Create a record',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record',
						action: 'Delete a record',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Retrieve a single record by ID',
						action: 'Get a record',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Retrieve multiple records',
						action: 'Get many records',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an existing record',
						action: 'Update a record',
					},
				],
				default: 'getAll',
			},

			// -------------------------------------------------------
			// Fields for "get" / "delete" / "update"
			// TODO: Adjust field names to match actual API schema
			// -------------------------------------------------------
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['exampleResource'],
						operation: ['get', 'delete', 'update'],
					},
				},
				description: 'The unique ID of the record',
			},

			// -------------------------------------------------------
			// Additional fields for "create" / "update"
			// TODO: Replace with actual schema fields from leadtributor API
			// -------------------------------------------------------
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['exampleResource'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Name of the record (placeholder field)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('leadtributorApi');
		const baseUrl = credentials.baseUrl as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// TODO: Map resources and operations to actual leadtributor API endpoints
				// See https://developer.leadtributor.cloud for available endpoints

				let responseData: unknown;

				if (resource === 'exampleResource') {
					// TODO: Replace '/v1/example-resource' with the actual API path
					const endpoint = '/v1/example-resource';

					if (operation === 'getAll') {
						const options: IRequestOptions = {
							method: 'GET',
							url: `${baseUrl}${endpoint}`,
							json: true,
						};
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'leadtributorApi',
							options,
						);
					} else if (operation === 'get') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const options: IRequestOptions = {
							method: 'GET',
							url: `${baseUrl}${endpoint}/${recordId}`,
							json: true,
						};
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'leadtributorApi',
							options,
						);
					} else if (operation === 'create') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as Record<
							string,
							unknown
						>;
						const options: IRequestOptions = {
							method: 'POST',
							url: `${baseUrl}${endpoint}`,
							body: { ...additionalFields },
							json: true,
						};
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'leadtributorApi',
							options,
						);
					} else if (operation === 'update') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as Record<
							string,
							unknown
						>;
						const options: IRequestOptions = {
							method: 'PATCH',
							url: `${baseUrl}${endpoint}/${recordId}`,
							body: { ...additionalFields },
							json: true,
						};
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'leadtributorApi',
							options,
						);
					} else if (operation === 'delete') {
						const recordId = this.getNodeParameter('recordId', i) as string;
						const options: IRequestOptions = {
							method: 'DELETE',
							url: `${baseUrl}${endpoint}/${recordId}`,
							json: true,
						};
						responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'leadtributorApi',
							options,
						);
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as Record<string, unknown> | Record<string, unknown>[]),
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
				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
