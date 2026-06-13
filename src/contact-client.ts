export class ContactClient {
    private readonly token: string;
    private readonly headers: { Authorization: string; "Content-Type": string };

    constructor(token: string) {
        this.token = token;
        this.headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
        const url = `https://contacts.infomaniak.com/api/pim${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.headers,
                ...(options.headers as Record<string, string> || {}),
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `API request failed: ${response.status} ${response.statusText}\n${text}`,
            );
        }

        return response.json();
    }

    async fetchAllContacts(): Promise<any[]> {
        const response = await this.apiRequest(
            "/contact/all?with=emails,phones,others,user_id",
        );

        if (response.result !== "success") {
            throw new Error(`API error: ${JSON.stringify(response)}`);
        }

        return response.data || [];
    }

    searchContacts(contacts: any[], query: string): any[] {
        const q = query.toLowerCase();
        return contacts.filter((c) => {
            const searchText = [
                c.name,
                c.firstname,
                c.lastname,
                ...(c.emails || []),
                ...(c.phones || []),
            ].filter(Boolean).join(" ").toLowerCase();
            return searchText.includes(q);
        });
    }
}
