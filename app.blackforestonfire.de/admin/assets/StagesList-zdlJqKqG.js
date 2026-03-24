import{B as r,a as i,s as e,b as s}from"./index-DM9i3pX3.js";class l extends r{#a=[];#e=null;#t={stageSlug:"",nameDe:"",nameFr:"",nameEn:"",sortOrder:0};async connectedCallback(){super.connectedCallback(),await this.#s()}async#s(){try{const t=await fetch("/api/stages");this.#a=await t.json()}catch{this.#a=[]}this.triggerViewUpdate()}async#i(t){t.preventDefault();try{const a=!this.#e,n=a?"/api/stages":`/api/stages/${this.#e}`;await i(n,{method:a?"POST":"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(this.#t)}),e("success",a?"Bühne angelegt.":"Bühne aktualisiert."),this.#e=null,this.#t={stageSlug:"",nameDe:"",nameFr:"",nameEn:"",sortOrder:0},await this.#s()}catch{e("error","Fehler beim Speichern.")}}async#n(t){if(confirm(`Bühne "${t}" wirklich löschen?`))try{await i(`/api/stages/${t}`,{method:"DELETE"}),e("success","Bühne gelöscht."),await this.#s()}catch{e("error","Fehler beim Löschen. Bühne hat verknüpfte Artists oder Acts?")}}#r(t){this.#e=t.stageSlug,this.#t={...t},this.triggerViewUpdate()}#l(){this.#e=null,this.#t={stageSlug:"",nameDe:"",nameFr:"",nameEn:"",sortOrder:0},this.triggerViewUpdate()}view(){return s`
            <div class="config-section">
                <h2>Bühnen</h2>

                <form @submit=${t=>this.#i(t)}>
                    <fieldset>
                        <legend>${this.#e?"Bühne bearbeiten":"Neue Bühne"}</legend>
                        <label>Slug <input type="text" pattern="[a-z0-9-]+" required
                            .value=${this.#t.stageSlug}
                            ?disabled=${!!this.#e}
                            @input=${t=>{this.#t.stageSlug=t.target.value}}
                            placeholder="main-stage"></label>
                        <label>Deutsch <input type="text" required .value=${this.#t.nameDe}
                            @input=${t=>{this.#t.nameDe=t.target.value}}></label>
                        <label>Français <input type="text" required .value=${this.#t.nameFr}
                            @input=${t=>{this.#t.nameFr=t.target.value}}></label>
                        <label>English <input type="text" required .value=${this.#t.nameEn}
                            @input=${t=>{this.#t.nameEn=t.target.value}}></label>
                        <label>Reihenfolge <input type="number" .value=${this.#t.sortOrder}
                            @input=${t=>{this.#t.sortOrder=parseInt(t.target.value)||0}}></label>
                        <div class="form-actions">
                            <button type="submit" class="primary-button">Speichern</button>
                            ${this.#e?s`
                                <button type="button" class="secondary-button" @click=${()=>this.#l()}>Abbrechen</button>
                            `:""}
                        </div>
                    </fieldset>
                </form>

                <table>
                    <thead><tr><th>Slug</th><th>DE</th><th>FR</th><th>EN</th><th>Reihenfolge</th><th></th></tr></thead>
                    <tbody>
                        ${this.#a.map(t=>s`
                            <tr>
                                <td>${t.stageSlug}</td>
                                <td>${t.nameDe}</td>
                                <td>${t.nameFr}</td>
                                <td>${t.nameEn}</td>
                                <td>${t.sortOrder}</td>
                                <td>
                                    <button class="secondary-button" @click=${()=>this.#r(t)}>Bearbeiten</button>
                                    <button class="secondary-button" @click=${()=>this.#n(t.stageSlug)}>Löschen</button>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `}}customElements.define("b-stages-list",l);
