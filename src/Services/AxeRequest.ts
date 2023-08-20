import formidable, { Options as FormOptions } from "formidable";
import { IncomingMessage } from "http";
import { getVersionByRequest } from "../Helpers";
import { ILanguage, IVersion } from "../Interfaces";
import { AcceptLanguageResolver } from "../Resolvers";
import LogService from "./LogService";

class AxeRequest {
  private request: IncomingMessage;
  private language: ILanguage;
  private urlObject: URL;
  private privateParams: any = {};
  private version: IVersion | undefined;

  constructor(request: IncomingMessage) {
    this.request = request;
    this.urlObject = new URL(request.url || "", "http://127.0.0.1");

    // Application configuration is need for the default setting.
    this.version = getVersionByRequest(this.urlObject);

    if (this.version) {
      // Setting the current language by the supported, default and the client prefences
      this.language = AcceptLanguageResolver.resolve(
        (this.request.headers["accept-language"] as string) || "",
        this.version.config.supportedLanguages || ["en"],
        this.version.config.defaultLanguage || "en"
      );
    } else {
      this.language = {
        title: "en",
        language: "en",
        region: null,
      };
    }
  }

  get url() {
    return this.urlObject;
  }

  get params() {
    return this.privateParams;
  }

  set params(value) {
    this.privateParams = value;
  }

  get query() {
    return this.urlObject.searchParams;
  }

  get path() {
    // TODO: Path
    return this.request.url || "";
  }

  get method() {
    return this.request.method || "GET";
  }

  get body() {
    return this.request.body;
  }

  get currentLanguage() {
    return this.language;
  }

  set currentLanguage(language: ILanguage) {
    this.language = language;
  }

  header(key: string) {
    return this.request.headers[key];
  }

  async files(options?: FormOptions) {
    if (!this.header("content-type")?.includes("multipart/form-data")) {
      LogService.warn(`Content-type must be 'multipart/form-data'.`);
      throw new Error(`Content-type must be 'multipart/form-data'.`);
    }

    LogService.debug(`Form data is parsing`);
    const form = formidable(options || this.version?.config.formidable || {});
    return await form.parse(this.request);
  }

  get original() {
    return this.request;
  }
}

export default AxeRequest;