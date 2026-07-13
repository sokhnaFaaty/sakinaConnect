export const ROLES = {
  ADMIN: "ADMIN",
  GUIDE: "GUIDE",
  PELERIN: "PELERIN",
  PROCHE: "PROCHE",
};


export const HOME_PAGE_BY_ROLE = {
  [ROLES.ADMIN]: "groupes",
  [ROLES.GUIDE]: "mon-groupe",
  [ROLES.PELERIN]: "dashboard-pelerin",
  [ROLES.PROCHE]: "dashboard-proche",
};