import { enableProdMode } from "@angular/core";

import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

registerLocaleData(localeFr);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
