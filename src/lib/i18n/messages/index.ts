import type { Locale } from "../config";

import enCommon from "./en/common.json";
import enStatus from "./en/status.json";
import enErrors from "./en/errors.json";
import enNav from "./en/nav.json";
import enAuth from "./en/auth.json";
import enUi from "./en/ui.json";
import enDashboard from "./en/dashboard.json";
import enClaims from "./en/claims.json";
import enClients from "./en/clients.json";
import enPayers from "./en/payers.json";
import enDocuments from "./en/documents.json";
import enImport from "./en/import.json";
import enReview from "./en/review.json";
import enRemittances from "./en/remittances.json";
import enUsers from "./en/users.json";
import enPermissions from "./en/permissions.json";
import enSettings from "./en/settings.json";
import enLib from "./en/lib.json";

import arCommon from "./ar/common.json";
import arStatus from "./ar/status.json";
import arErrors from "./ar/errors.json";
import arNav from "./ar/nav.json";
import arAuth from "./ar/auth.json";
import arUi from "./ar/ui.json";
import arDashboard from "./ar/dashboard.json";
import arClaims from "./ar/claims.json";
import arClients from "./ar/clients.json";
import arPayers from "./ar/payers.json";
import arDocuments from "./ar/documents.json";
import arImport from "./ar/import.json";
import arReview from "./ar/review.json";
import arRemittances from "./ar/remittances.json";
import arUsers from "./ar/users.json";
import arPermissions from "./ar/permissions.json";
import arSettings from "./ar/settings.json";
import arLib from "./ar/lib.json";

export const NAMESPACES = [
  "common",
  "status",
  "errors",
  "nav",
  "auth",
  "ui",
  "dashboard",
  "claims",
  "clients",
  "payers",
  "documents",
  "import",
  "review",
  "remittances",
  "users",
  "permissions",
  "settings",
  "lib",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

type Bundle = Record<Namespace, Record<string, string>>;

const EN: Bundle = {
  common: enCommon,
  status: enStatus,
  errors: enErrors,
  nav: enNav,
  auth: enAuth,
  ui: enUi,
  dashboard: enDashboard,
  claims: enClaims,
  clients: enClients,
  payers: enPayers,
  documents: enDocuments,
  import: enImport,
  review: enReview,
  remittances: enRemittances,
  users: enUsers,
  permissions: enPermissions,
  settings: enSettings,
  lib: enLib,
};

const AR: Bundle = {
  common: arCommon,
  status: arStatus,
  errors: arErrors,
  nav: arNav,
  auth: arAuth,
  ui: arUi,
  dashboard: arDashboard,
  claims: arClaims,
  clients: arClients,
  payers: arPayers,
  documents: arDocuments,
  import: arImport,
  review: arReview,
  remittances: arRemittances,
  users: arUsers,
  permissions: arPermissions,
  settings: arSettings,
  lib: arLib,
};

function flatten(bundle: Bundle): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [namespace, messages] of Object.entries(bundle)) {
    for (const [key, value] of Object.entries(messages)) {
      flat[`${namespace}.${key}`] = value;
    }
  }
  return flat;
}

/** Keys are dotted and namespaced: "common.save", "status.PAID". */
export const MESSAGES: Record<Locale, Record<string, string>> = {
  en: flatten(EN),
  ar: flatten(AR),
};
