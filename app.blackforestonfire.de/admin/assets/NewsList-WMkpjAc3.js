import{B as n,a as e,s,n as a,b as i}from"./index-DM9i3pX3.js";class d extends n{#t=[];async connectedCallback(){super.connectedCallback(),await this.#e()}async#e(){try{const t=await e("/api/news?includeDrafts=true");this.#t=await t.json()}catch{this.#t=[]}this.triggerViewUpdate()}async#s(t,c){if(confirm(`"${c}" wirklich löschen?`))try{await e(`/api/news/${t}`,{method:"DELETE"}),s("success","News gelöscht."),await this.#e()}catch{s("error","Fehler beim Löschen.")}}view(){return i`
            <div class="config-section">
                <div class="list-header">
                    <h2>News</h2>
                    <button class="primary-button" @click=${()=>a("/admin/news/new")}>+ Neu</button>
                </div>
                <table>
                    <thead><tr><th>Titel (DE)</th><th>Veröffentlicht am</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                        ${this.#t.map(t=>i`
                            <tr>
                                <td>${t.titleDe}</td>
                                <td>${new Date(t.publishedAt).toLocaleString("de-DE")}</td>
                                <td>${t.published?"Veröffentlicht":"Entwurf"}</td>
                                <td>
                                    <button class="secondary-button" @click=${()=>a(`/admin/news/${t.id}`)}>Bearbeiten</button>
                                    <button class="secondary-button" @click=${()=>this.#s(t.id,t.titleDe)}>Löschen</button>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `}}customElements.define("b-news-list",d);
