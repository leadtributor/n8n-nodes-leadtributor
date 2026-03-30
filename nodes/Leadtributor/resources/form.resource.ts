import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ResourceModule } from './types';

const description: INodeProperties[] = [
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
];

async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	baseUrl: string,
): Promise<unknown> {
	if (operation === 'getMany') {
		return this.helpers.httpRequestWithAuthentication.call(this, 'leadtributorApi', {
			method: 'GET',
			url: `${baseUrl}/forms`,
			json: true,
		});
	}

	throw new NodeOperationError(this.getNode(), `Unknown form operation: ${operation}`, {
		itemIndex: i,
	});
}

export default { displayName: 'Form', description, execute } satisfies ResourceModule;
