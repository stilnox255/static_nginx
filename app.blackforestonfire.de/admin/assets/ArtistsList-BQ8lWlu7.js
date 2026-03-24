import{B as i,a as n,s as a,n as e,b as s}from"./index-DM9i3pX3.js";class c extends i{#t=[];async connectedCallback(){super.connectedCallback(),await this.#s()}async#s(){try{const t=await fetch("/api/artists");this.#t=await t.json()}catch{this.#t=[]}this.triggerViewUpdate()}async#a(t){if(confirm(`Artist "${t}" wirklich löschen?`))try{await n(`/api/artists/${t}`,{method:"DELETE"}),a("success","Artist gelöscht."),await this.#s()}catch{a("error","Fehler beim Löschen.")}}view(){return s`
            <div class="config-section">
                <div class="list-header">
                    <h2>Artists</h2>
                    <button class="primary-button" @click=${()=>e("/admin/artists/new")}>+ Neu</button>
                </div>
                <table>
                    <thead><tr><th>Name</th><th></th></tr></thead>
                    <tbody>
                        ${this.#t.map(t=>s`
                            <tr>
                                <td>${t.headliner?s`<strong>${t.name}</strong>`:t.name}</td>
                                <td>
                                    <button class="secondary-button" @click=${()=>e(`/admin/artists/${t.slug}`)}>Bearbeiten</button>
                                    <button class="secondary-button" @click=${()=>this.#a(t.slug)}>Löschen</button>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `}}customElements.define("b-artists-list",c);
