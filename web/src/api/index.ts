import config from "@/config";
import { getToken } from "@/storage";
import Ky from "ky";

const API_BASE = config.api_base || "/api";

const ky = Ky.create({
  prefixUrl: API_BASE,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      (_, __, response) => {
        if (response.status === 200 && response.headers.has("Set-Token")) {
          const token = response.headers.get("Set-Token");
          if (token) {
            const account = JSON.parse(window.localStorage.getItem("account") || "{}");
            account.token = token;
            window.localStorage.setItem("account", JSON.stringify(account));
          }
        }
      },
    ],
  },
  retry: {
    limit: 0,
  },
});

export interface UserData {
  id: string;
  account: string;
  nickname: string;
  permissions: number[];
  exp: number;
}

export function getUserInfo() {
  return ky.get("user").json<UserData>();
}

export interface ProjectListItem {
  id: string;
  name: string;
}

export function getProjectList() {
  return ky.get("i18n").json<ProjectListItem[]>();
}

export interface ProjectInfo {
  id: string;
  name: string;
  default: string;
  locales: string[];
}

export function getProjectInfo(proj_id: string) {
  return ky.get(`i18n/${proj_id}`).json<ProjectInfo>();
}

export type Translations = Record<string, string>;

export function getTranslations(proj_id: string, locale: string) {
  return ky.get(`i18n/${proj_id}/${locale}`).json<Translations>();
}

export interface PatchTranslationResponse {
  success: boolean;
  data: Translations;
}

export function updateTranslation(proj_id: string, locale: string, key: string, value: string) {
  return ky
    .patch(`i18n/${proj_id}/${locale}`, {
      json: { key, value },
    })
    .json<PatchTranslationResponse>();
}


export default {
  getUserInfo,
  getProjectList,
  getProjectInfo,
  getTranslations,
  updateTranslation,
};