import{B as i,a as r,b as s}from"./index-DM9i3pX3.js";class o extends i{#t=1;#s=null;#a=!1;async connectedCallback(){super.connectedCallback(),await this.#e()}async#e(){this.#a=!1,this.triggerViewUpdate();try{const t=await r(`/api/broadcasts?page=${this.#t}&pageSize=20`);if(!t.ok)throw new Error(`HTTP ${t.status}`);this.#s=await t.json()}catch{this.#a=!0}this.triggerViewUpdate()}#i(t){return new Date(t).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}#r(t){return s`
            <div class="config-section">
                <div class="history-card-header">
                    <span>${this.#i(t.sentAt)}</span>
                    ${t.tag?s`<span class="history-tag-badge">${t.tag}</span>`:""}
                    <span class="history-reached">${t.subscribersReached} Empfänger</span>
                </div>
                <p class="history-title-de">${t.titleDe}</p>
                <p>${t.bodyDe}</p>
                <details>
                    <summary>Français</summary>
                    <p class="history-detail-title">${t.titleFr}</p>
                    <p>${t.bodyFr}</p>
                </details>
                <details>
                    <summary>English</summary>
                    <p class="history-detail-title">${t.titleEn}</p>
                    <p>${t.bodyEn}</p>
                </details>
            </div>
        `}view(){if(this.#a)return s`<p class="error">Fehler beim Laden der Historie.</p>`;if(!this.#s)return s`<p style="color: var(--color-text-muted)">Wird geladen…</p>`;const{meta:t,items:a}=this.#s;return s`
            <div class="history-list">
                ${a.length===0?s`<p style="color: var(--color-text-muted)">Noch keine Nachrichten gesendet.</p>`:a.map(e=>this.#r(e))}
            </div>
            <div class="history-pagination">
                ${this.#t>1?s`
                    <button class="secondary-button"
                            @click=${()=>{this.#t--,this.#e()}}>Zurück</button>
                `:""}
                <span>Seite ${t.page} von ${Math.max(1,t.totalPages)}</span>
                ${this.#t<t.totalPages?s`
                    <button class="secondary-button"
                            @click=${()=>{this.#t++,this.#e()}}>Weiter</button>
                `:""}
            </div>
        `}}customElements.define("b-broadcast-history",o);
