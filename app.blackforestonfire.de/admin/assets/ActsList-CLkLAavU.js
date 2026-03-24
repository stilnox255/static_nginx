import{B as a,a as n,s as e,n as s,b as i}from"./index-DM9i3pX3.js";class d extends a{#t=[];async connectedCallback(){super.connectedCallback(),await this.#e()}async#e(){try{const t=await fetch("/api/acts");this.#t=await t.json()}catch{this.#t=[]}this.triggerViewUpdate()}async#s(t,c){if(confirm(`Act "${c}" wirklich löschen?`))try{await n(`/api/acts/${t}`,{method:"DELETE"}),e("success","Act gelöscht."),await this.#e()}catch{e("error","Fehler beim Löschen.")}}view(){return i`
            <div class="config-section">
                <div class="list-header">
                    <h2>Acts / Running Order</h2>
                    <button class="primary-button" @click=${()=>s("/admin/acts/new")}>+ Neu</button>
                </div>
                <table>
                    <thead><tr><th>Name (DE)</th><th>Beschreibung</th><th>Bühne</th><th>Startzeit</th><th>Override</th><th></th></tr></thead>
                    <tbody>
                        ${this.#t.map(t=>i`
                            <tr>
                                <td>${t.nameDe}</td>
                                <td class="description-preview">${t.descriptionDe?t.descriptionDe.slice(0,60)+(t.descriptionDe.length>60?"…":""):"—"}</td>
                                <td>${t.stageSlug}</td>
                                <td>${new Date(t.scheduledAt).toLocaleString("de-DE")}</td>
                                <td>${t.timeOverride?new Date(t.timeOverride).toLocaleString("de-DE"):"—"}</td>
                                <td>
                                    <button class="secondary-button" @click=${()=>s(`/admin/acts/${t.id}`)}>Bearbeiten</button>
                                    <button class="secondary-button" @click=${()=>this.#s(t.id,t.nameDe)}>Löschen</button>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `}}customElements.define("b-acts-list",d);
