import{B as n,s as i,a,n as l,b as r}from"./index-DM9i3pX3.js";class o extends n{#i=null;#a=!1;#t={slug:"",name:"",headliner:!1,bioDe:"",bioFr:"",bioEn:"",imageAvatar:"",imageLineup:"",spotify:"",instagram:"",facebook:"",youtube:""};async connectedCallback(){super.connectedCallback(),this.#i=this.location?.params?.slug??null,this.#i&&await this.#s(),this.triggerViewUpdate()}async#s(){try{const t=await fetch(`/api/artists/${this.#i}`);if(!t.ok)throw new Error;const e=await t.json();this.#t={slug:e.slug,name:e.name,headliner:e.headliner,bioDe:e.bioDe,bioFr:e.bioFr,bioEn:e.bioEn,imageAvatar:e.imageAvatar??"",imageLineup:e.imageLineup??"",spotify:e.spotify??"",instagram:e.instagram??"",facebook:e.facebook??"",youtube:e.youtube??""}}catch{i("error","Fehler beim Laden.")}}async#l(){if(this.#t.bioDe){this.#a=!0,this.triggerViewUpdate();try{const e=await(await a("/api/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:"",body:this.#t.bioDe})})).json();this.#t.bioFr=e.fr?.body??"",this.#t.bioEn=e.en?.body??""}catch{}this.#a=!1,this.triggerViewUpdate()}}async#n(t){t.preventDefault();const e={...this.#t};["imageAvatar","imageLineup","spotify","instagram","facebook","youtube"].forEach(s=>{e[s]||(e[s]=null)});try{this.#i?(await a(`/api/artists/${this.#i}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),i("success","Artist gespeichert.")):(await a("/api/artists",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),i("success","Artist angelegt.")),l("/admin/artists")}catch{i("error","Fehler beim Speichern.")}}#e(t){return e=>{this.#t[t]=e.target.value}}#r(t){return e=>{this.#t[t]=e.target.checked}}view(){const t=this.#t;return r`
            <div class="config-section">
                <h2>${this.#i?"Artist bearbeiten":"Neuer Artist"}</h2>
                <form @submit=${e=>this.#n(e)}>
                    <fieldset>
                        <legend>Allgemein</legend>
                        <label>Slug <input type="text" required pattern="[a-z0-9-]+"
                            .value=${t.slug} ?disabled=${!!this.#i} @input=${this.#e("slug")}></label>
                        <label>Name <input type="text" required .value=${t.name} @input=${this.#e("name")}></label>
                        <label><input type="checkbox" .checked=${t.headliner} @change=${this.#r("headliner")}> Headliner</label>
                    </fieldset>

                    <fieldset>
                        <legend>Biografie</legend>
                        <label>Deutsch <textarea rows="4" .value=${t.bioDe} @input=${this.#e("bioDe")}></textarea></label>
                        <button type="button" class="secondary-button" ?disabled=${this.#a}
                            @click=${()=>this.#l()}>
                            ${this.#a?"Wird übersetzt…":"Übersetzen"}
                        </button>
                        <fieldset ?disabled=${this.#a}>
                            <label>Français <textarea rows="4" .value=${t.bioFr} @input=${this.#e("bioFr")}></textarea></label>
                            <label>English <textarea rows="4" .value=${t.bioEn} @input=${this.#e("bioEn")}></textarea></label>
                        </fieldset>
                    </fieldset>

                    <fieldset>
                        <legend>Bilder</legend>
                        <label>Avatar-URL <input type="url" .value=${t.imageAvatar} @input=${this.#e("imageAvatar")}></label>
                        <label>Lineup-Bild-URL <input type="url" .value=${t.imageLineup} @input=${this.#e("imageLineup")}></label>
                    </fieldset>

                    <fieldset>
                        <legend>Social Links</legend>
                        <label>Spotify <input type="url" .value=${t.spotify} @input=${this.#e("spotify")}></label>
                        <label>Instagram <input type="url" .value=${t.instagram} @input=${this.#e("instagram")}></label>
                        <label>Facebook <input type="url" .value=${t.facebook} @input=${this.#e("facebook")}></label>
                        <label>YouTube <input type="url" .value=${t.youtube} @input=${this.#e("youtube")}></label>
                    </fieldset>

                    <div class="form-actions">
                        <button type="submit" class="primary-button">Speichern</button>
                        <button type="button" class="secondary-button" @click=${()=>l("/admin/artists")}>Abbrechen</button>
                    </div>
                </form>
            </div>
        `}}customElements.define("b-artist-form",o);
