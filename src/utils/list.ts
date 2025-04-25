import path from "node:path";
import config from "@/config";
import Bun from "bun";

interface I18nFile {
  project_id: string;
  filepath: string;
  locale: string;
  ext: string;
  basename: string;
}

interface I18nProjects {
  [key: string]: {
    id: string;
    name: string;
    files: I18nFile[];
    default: string;
  };
}

export function getI18nProjects(): I18nProjects {
  const projects: I18nProjects = {};

  for (const trans_proj of config.i18n) {
    const glob = new Bun.Glob(trans_proj.glob);
    const files: I18nFile[] = [];
    for (const fp of glob.scanSync()) {
      const basename = path.basename(fp);
      const ext = path.extname(fp);
      const locale = basename.slice(0, basename.length - ext.length);
      files.push({
        project_id: trans_proj.id,
        filepath: fp,
        locale,
        ext,
        basename,
      });
    }
    projects[trans_proj.id] = {
      id: trans_proj.id,
      name: trans_proj.name,
      files,
      default: trans_proj.default,
    };
  }

  return projects;
}
