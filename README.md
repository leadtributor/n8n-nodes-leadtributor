# n8n-nodes-leadtributor

This is an n8n community node for integrating with the [leadtributor.cloud](https://leadtributor.cloud) platform.

[leadtributor.cloud](https://leadtributor.cloud) is a B2B software solution for lead distribution and forecasting management.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```
n8n-nodes-leadtributor
```

## Credentials

To use this node, you need a **leadtributor API Key**:

1. Log in to your [leadtributor.cloud](https://leadtributor.cloud) account.
2. Navigate to your account settings and generate an API Key.
3. In n8n, add new credentials of type **leadtributor API**.
4. Enter your API Key and (optionally) the base URL.

| Field    | Description                                       | Default                              |
|----------|---------------------------------------------------|--------------------------------------|
| API Key  | Your leadtributor API Key                         | –                                    |
| Base URL | Base URL of the leadtributor API                  | `https://api.leadtributor.cloud`     |

## Operations

> **Note:** This is an initial scaffold. Resources and operations are placeholders and will be
> replaced with actual leadtributor API endpoints.
> See [https://developer.leadtributor.cloud](https://developer.leadtributor.cloud) for the API reference.

### Example Resource *(placeholder)*

| Operation | Description                  |
|-----------|------------------------------|
| Create    | Create a new record          |
| Delete    | Delete a record by ID        |
| Get       | Retrieve a single record     |
| Get Many  | Retrieve multiple records    |
| Update    | Update an existing record    |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Build in watch mode
npm run dev

# Lint
npm run lint

# Format
npm run format
```

To test locally, copy (or symlink) the `dist/` folder into your n8n custom extensions directory and start n8n:

```bash
export N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-leadtributor"
n8n start
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [leadtributor.cloud](https://leadtributor.cloud)
- [leadtributor API documentation](https://developer.leadtributor.cloud)

## License

[MIT](LICENSE)
