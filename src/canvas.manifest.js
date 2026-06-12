export const manifest = {
  screens: {
    scr_prsrzn: { name: "Home", route: "/", position: { "x": 4360, "y": 1820 } },
    scr_5lsyjz: { name: "About Us", route: "/about", position: { "x": 160, "y": 11720 } },
    scr_thz5v0: { name: "Our Purpose", route: "/purpose", position: { "x": 1560, "y": 11720 } },
    scr_cwfnsc: { name: "Contact Us", route: "/contact", position: { "x": 2960, "y": 11720 } },
    scr_bucopd: { name: "Login", route: "/login", position: { "x": 160, "y": 1820 } },
    scr_p7tuvt: { name: "Sign up — employee", route: "/signup?role=employee", position: { "x": 1560, "y": 1820 } },
    scr_3xlssk: { name: "Sign up — company", route: "/signup?role=company", position: { "x": 2960, "y": 1820 } },
    scr_5dcikx: { name: "Jobs list", route: "/jobs", position: { "x": 160, "y": 3800 } },
    scr_gmhbkw: { name: "Job detail", route: "/jobs/1", position: { "x": 1560, "y": 3800 } },
    scr_wxulg9: { name: "Employee setup", route: "/employee/setup", position: { "x": 160, "y": 5780 } },
    scr_ta9roc: { name: "Employee dashboard", route: "/employee/dashboard", position: { "x": 1560, "y": 5780 } },
    scr_t1usaa: { name: "Employee profile", route: "/employee/profile", position: { "x": 4360, "y": 5780 } },
    scr_a2dmca: { name: "CV generator", route: "/employee/cv-generator", position: { "x": 2960, "y": 5780 } },
    scr_rat1r4: { name: "Company setup", route: "/company/setup", position: { "x": 160, "y": 7760 } },
    scr_89nc3s: { name: "Company dashboard", route: "/company/dashboard", position: { "x": 1560, "y": 7760 } },
    scr_dg4yl8: { name: "Company profile", route: "/company/profile", position: { "x": 4360, "y": 7760 } },
    scr_uvapnd: { name: "Post a job", route: "/company/post-job", position: { "x": 2960, "y": 7760 } },
    scr_ktfgh0: { name: "Admin dashboard", route: "/admin", position: { "x": 160, "y": 9740 } }
  },
  sections: {
    sec_ke6fxu: { name: "Auth & Onboarding", x: 0, y: 1600, width: 5720, height: 1180 },
    sec_bx1sop: { name: "Job Discovery", x: 0, y: 3580, width: 2920, height: 1180 },
    sec_84x0ra: { name: "Employee Workspace", x: 0, y: 5560, width: 5720, height: 1180 },
    sec_mflvoo: { name: "Company Workspace", x: 0, y: 7540, width: 5720, height: 1180 },
    sec_1nywgc: { name: "Admin", x: 0, y: 9520, width: 1520, height: 1180 },
    sec_05czsf: { name: "Company Information", x: 0, y: 11500, width: 4320, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_ke6fxu", children: [
    { kind: "screen", id: "scr_bucopd" },
    { kind: "screen", id: "scr_p7tuvt" },
    { kind: "screen", id: "scr_3xlssk" },
    { kind: "screen", id: "scr_prsrzn" }]
  },
  { kind: "section", id: "sec_bx1sop", children: [
    { kind: "screen", id: "scr_5dcikx" },
    { kind: "screen", id: "scr_gmhbkw" }]
  },
  { kind: "section", id: "sec_84x0ra", children: [
    { kind: "screen", id: "scr_wxulg9" },
    { kind: "screen", id: "scr_ta9roc" },
    { kind: "screen", id: "scr_a2dmca" },
    { kind: "screen", id: "scr_t1usaa" }]
  },
  { kind: "section", id: "sec_mflvoo", children: [
    { kind: "screen", id: "scr_rat1r4" },
    { kind: "screen", id: "scr_89nc3s" },
    { kind: "screen", id: "scr_uvapnd" },
    { kind: "screen", id: "scr_dg4yl8" }]
  },
  { kind: "section", id: "sec_1nywgc", children: [
    { kind: "screen", id: "scr_ktfgh0" }]
  },
  { kind: "section", id: "sec_05czsf", children: [
    { kind: "screen", id: "scr_5lsyjz" },
    { kind: "screen", id: "scr_thz5v0" },
    { kind: "screen", id: "scr_cwfnsc" }]
  }]

};