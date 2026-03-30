import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeProperties,
	INodePropertyOptions,
	ResourceMapperFields,
} from 'n8n-workflow';

export interface ResourceMethods {
	loadOptions?: Record<string, (this: ILoadOptionsFunctions) => Promise<INodePropertyOptions[]>>;
	resourceMapping?: Record<string, (this: ILoadOptionsFunctions) => Promise<ResourceMapperFields>>;
}

export interface ResourceModule {
	displayName: string;
	description: INodeProperties[];
	methods?: ResourceMethods;
	execute(this: IExecuteFunctions, i: number, operation: string, baseUrl: string): Promise<unknown>;
}
