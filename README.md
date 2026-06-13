# Contact MCP Server

MCP Server for the Infomaniak Contacts API.

## Tools

1. `contact_list`
   - List all contacts across all address books in your Infomaniak account
   - Returns: Full contact records with name, emails, phones, and other fields

2. `contact_search`
   - Search contacts by name, email, or phone number
   - Required inputs:
     - `query` (string): Search query string
   - Returns: Matching contacts with full details

## Setup

1. Create a token linked to your user:
    - Visit the [API Token page](https://manager.infomaniak.com/v3/ng/accounts/token/list)
    - Choose "contacts" scope

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### NPX

```json
{
  "mcpServers": {
    "contact": {
      "command": "npx",
      "args": [
        "-y",
        "@infomaniak/mcp-server-contact"
      ],
      "env": {
        "CONTACT_TOKEN": "your-token"
      }
    }
  }
}
```

#### Docker

```json
{
  "mcpServers": {
    "contact": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "CONTACT_TOKEN",
        "infomaniak/mcp-server-contact"
      ],
      "env": {
        "CONTACT_TOKEN": "your-token"
      }
    }
  }
}
```

### Environment Variables

1. `CONTACT_TOKEN`: Required. Your Infomaniak API token with contacts scope.

### Troubleshooting

If you encounter permission errors, verify that:
1. The token has the "contacts" scope
2. The token is correctly copied to your configuration

## Build

Docker build:

```bash
docker build -t infomaniak/mcp-server-contact -f Dockerfile .
```

## License

This MCP server is licensed under the MIT License.
