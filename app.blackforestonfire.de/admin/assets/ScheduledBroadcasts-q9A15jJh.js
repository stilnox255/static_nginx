import{B as i,a,b as t,n as r}from"./index-DM9i3pX3.js";class c extends i{#e=null;#t=!1;#s=null;async connectedCallback(){super.connectedCallback(),await this.#a()}async#a(){this.#t=!1,this.#s=null,this.triggerViewUpdate();try{const e=await a("/api/scheduled-broadcasts");if(!e.ok)throw new Error(`HTTP ${e.status}`);this.#e=await e.json()}catch{this.#t=!0}this.triggerViewUpdate()}async#r(e){try{const s=await a(`/api/scheduled-broadcasts/${e}`,{method:"DELETE"});if(!s.ok)throw new Error(`HTTP ${s.status}`);await this.#a()}catch{this.#t=!0,this.triggerViewUpdate()}}#i(e){return new Date(e).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}#c(e){const s=this.#s===e.id;return t`
            <div class="config-section">
                <div class="scheduled-card-header">
                    <span>${this.#i(e.scheduledAt)}</span>
                    ${e.tag?t`<span class="scheduled-tag-badge">${e.tag}</span>`:""}
                    <span style="color: var(--color-text-muted); font-size: 0.8rem">
                        erstellt am ${this.#i(e.createdAt)}
                    </span>
                </div>
                <p><strong>${e.titleDe}</strong></p>
                <p>${e.bodyDe}</p>
                <div class="scheduled-card-actions">
                    <button class="secondary-button"
                            @click=${()=>r(`/admin/send/${e.id}`)}>
                        Bearbeiten
                    </button>
                    <button class="secondary-button"
                            @click=${()=>{s?this.#r(e.id):(this.#s=e.id,this.triggerViewUpdate())}}>
                        ${s?"Sicher?":"Löschen"}
                    </button>
                </div>
            </div>
        `}view(){return this.#t?t`<p class="error">Fehler beim Laden der geplanten Nachrichten.</p>`:this.#e?t`
            <h2>Geplante Nachrichten</h2>
            ${this.#e.length===0?t`<p style="color: var(--color-text-muted)">Keine geplanten Nachrichten.</p>`:t`<div class="scheduled-list">${this.#e.map(e=>this.#c(e))}</div>`}
        `:t`<p style="color: var(--color-text-muted)">Wird geladen…</p>`}}customElements.define("b-scheduled-broadcasts",c);
