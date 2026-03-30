import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import type { ResourceModule } from './resources/types';
import form from './resources/form.resource';
import lead from './resources/lead.resource';
import market from './resources/market.resource';
import note from './resources/note.resource';
import webhook from './resources/webhook.resource';

export class Leadtributor implements INodeType {
	private static readonly resources: Record<string, ResourceModule> = {
		form,
		lead,
		market,
		note,
		webhook,
	};

	description: INodeTypeDescription = {
		displayName: 'leadtributor.cloud',
		name: 'leadtributor',
		icon: 'file:leadtributor.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the leadtributor.cloud API for lead management',
		defaults: { name: 'leadtributor.cloud' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'leadtributorApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: Object.entries(Leadtributor.resources).map(([value, r]) => ({ name: r.displayName, value })),
				default: 'lead',
			},
			...Object.values(Leadtributor.resources).flatMap((r) => r.description),
		],
	};

	methods: INodeType['methods'] = {
		loadOptions: Object.fromEntries(
			Object.values(Leadtributor.resources).flatMap((r) =>
				Object.entries(r.methods?.loadOptions ?? {}),
			),
		),
		resourceMapping: Object.fromEntries(
			Object.values(Leadtributor.resources).flatMap((r) =>
				Object.entries(r.methods?.resourceMapping ?? {}),
			),
		),
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('leadtributorApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const handler = Leadtributor.resources[resource];
		if (!handler) {
			throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const responseData = await handler.execute.call(this, i, operation, baseUrl);

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						Array.isArray(responseData) ? responseData : [responseData as IDataObject],
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
