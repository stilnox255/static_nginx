import{B as l,s as i,a,n,b as s}from"./index-DM9i3pX3.js";class o extends l{#s=null;#a=[];#n=[];#i=!1;#t={nameDe:"",nameFr:"",nameEn:"",stageSlug:"",scheduledAt:"",durationMinutes:60,timeOverride:"",artistSlug:"",descriptionDe:"",descriptionFr:"",descriptionEn:""};async connectedCallback(){super.connectedCallback(),this.#s=this.location?.params?.id??null;const[e,t]=await Promise.all([fetch("/api/stages"),fetch("/api/artists")]);this.#a=await e.json(),this.#n=await t.json(),this.#s&&await this.#o(),this.triggerViewUpdate()}#r(e){if(!e)return"";const t=new Date(e);return new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,16)}async#o(){try{const t=(await(await fetch("/api/acts")).json()).find(r=>r.id===this.#s);if(!t)throw new Error;this.#t={nameDe:t.nameDe,nameFr:t.nameFr,nameEn:t.nameEn,stageSlug:t.stageSlug,scheduledAt:this.#r(t.scheduledAt),durationMinutes:t.durationMinutes,timeOverride:this.#r(t.timeOverride),artistSlug:t.artistSlug??"",descriptionDe:t.descriptionDe??"",descriptionFr:t.descriptionFr??"",descriptionEn:t.descriptionEn??""}}catch{i("error","Fehler beim Laden.")}}async#l(){if(this.#t.nameDe){this.#i=!0,this.triggerViewUpdate();try{const t=await(await a("/api/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:this.#t.nameDe,body:this.#t.descriptionDe})})).json();this.#t.nameFr=t.fr?.title??"",this.#t.nameEn=t.en?.title??"",this.#t.descriptionFr=t.fr?.body??"",this.#t.descriptionEn=t.en?.body??""}catch{}this.#i=!1,this.triggerViewUpdate()}}async#d(e){e.preventDefault();const t={nameDe:this.#t.nameDe,nameFr:this.#t.nameFr,nameEn:this.#t.nameEn,stageSlug:this.#t.stageSlug,scheduledAt:new Date(this.#t.scheduledAt).toISOString(),durationMinutes:this.#t.durationMinutes,timeOverride:this.#t.timeOverride?new Date(this.#t.timeOverride).toISOString():null,artistSlug:this.#t.artistSlug||null,descriptionDe:this.#t.descriptionDe,descriptionFr:this.#t.descriptionFr,descriptionEn:this.#t.descriptionEn};try{this.#s?(await a(`/api/acts/${this.#s}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),i("success","Act gespeichert.")):(await a("/api/acts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),i("success","Act angelegt.")),n("/admin/acts")}catch{i("error","Fehler beim Speichern.")}}#e(e){return t=>{this.#t[e]=t.target.value}}view(){const e=this.#t;return s`
            <div class="config-section">
                <h2>${this.#s?"Act bearbeiten":"Neuer Act"}</h2>
                <form @submit=${t=>this.#d(t)}>
                    <fieldset>
                        <legend>Name</legend>
                        <label>Deutsch <input type="text" required .value=${e.nameDe} @input=${this.#e("nameDe")}></label>
                        <button type="button" class="secondary-button" ?disabled=${this.#i}
                            @click=${()=>this.#l()}>
                            ${this.#i?"Wird übersetzt…":"Übersetzen"}
                        </button>
                        <fieldset ?disabled=${this.#i}>
                            <label>Français <input type="text" .value=${e.nameFr} @input=${this.#e("nameFr")}></label>
                            <label>English <input type="text" .value=${e.nameEn} @input=${this.#e("nameEn")}></label>
                        </fieldset>
                    </fieldset>

                    <fieldset>
                        <legend>Beschreibung</legend>
                        <label>Deutsch
                            <textarea rows="4" .value=${e.descriptionDe}
                                @input=${this.#e("descriptionDe")}></textarea>
                        </label>
                        <button type="button" class="secondary-button" ?disabled=${this.#i}
                            @click=${()=>this.#l()}>
                            ${this.#i?"Wird übersetzt…":"Übersetzen"}
                        </button>
                        <fieldset ?disabled=${this.#i}>
                            <label>Français
                                <textarea rows="4" .value=${e.descriptionFr}
                                    @input=${this.#e("descriptionFr")}></textarea>
                            </label>
                            <label>English
                                <textarea rows="4" .value=${e.descriptionEn}
                                    @input=${this.#e("descriptionEn")}></textarea>
                            </label>
                        </fieldset>
                    </fieldset>

                    <fieldset>
                        <legend>Planung</legend>
                        <label>Bühne
                            <select @change=${this.#e("stageSlug")}>
                                ${this.#a.map(t=>s`
                                    <option value=${t.stageSlug} ?selected=${e.stageSlug===t.stageSlug}>${t.nameDe}</option>
                                `)}
                            </select>
                        </label>
                        <label>Startzeit <input type="datetime-local" required .value=${e.scheduledAt} @input=${this.#e("scheduledAt")}></label>
                        <label>Dauer (Minuten) <input type="number" min="1" .value=${e.durationMinutes}
                            @input=${t=>{this.#t.durationMinutes=parseInt(t.target.value)||60}}></label>
                        <label>Zeitänderung (optional)
                            <input type="datetime-local" .value=${e.timeOverride} @input=${this.#e("timeOverride")}>
                            ${e.timeOverride?s`<button type="button" class="secondary-button"
                                @click=${()=>{this.#t.timeOverride="",this.triggerViewUpdate()}}>Entfernen</button>`:""}
                        </label>
                        <label>Verknüpfter Artist (optional)
                            <select @change=${this.#e("artistSlug")}>
                                <option value="" ?selected=${!e.artistSlug}>— Kein Artist —</option>
                                ${this.#n.map(t=>s`
                                    <option value=${t.slug} ?selected=${e.artistSlug===t.slug}>${t.name}</option>
                                `)}
                            </select>
                        </label>
                    </fieldset>

                    <div class="form-actions">
                        <button type="submit" class="primary-button">Speichern</button>
                        <button type="button" class="secondary-button" @click=${()=>n("/admin/acts")}>Abbrechen</button>
                    </div>
                </form>
            </div>
        `}}customElements.define("b-act-form",o);
