export type Anggota = {
  iduser       : string;
  email        : string;
  name         : string;
  isowner      : boolean;
  kodemenuAktif: string[];
};

export type MenuOption = {
  kodemenu: string;
  namamenu: string;
};
