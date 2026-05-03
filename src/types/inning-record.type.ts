export type InningRecord = {
    inning: number;
    homePlayerPockets: number[];
    visitorPlayerPockets: number[];
    isHomePlayerSafety: boolean;
    isVisitorPlayerSafety: boolean;
    isHomePlayerBreak: boolean;
    isVisitorPlayerBreak: boolean;
}