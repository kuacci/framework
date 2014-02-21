/// <reference path="globals.ts"/>

export var Keys = {
    tabId: "sfTabId",
    antiForgeryToken: "__RequestVerificationToken",

    entityTypeNames: "sfEntityTypeNames",
    entityTypeNiceNames: "sfEntityTypeNiceNames",

    runtimeInfo: "sfRuntimeInfo",
    staticInfo: "sfStaticInfo",
    toStr: "sfToStr",
    link: "sfLink",
    loading: "loading",
    entityState: "sfEntityState",

    viewMode: "sfViewMode",
};


export class RuntimeInfo {
    type: string;
    id: number;
    isNew: boolean;
    ticks: number;

    constructor(entityType: string, id: number, isNew: boolean, ticks?: number) {
        if (SF.isEmpty(entityType))
            throw new Error("entityTyp is mandatory for RuntimeInfo");

        this.type = entityType;
        this.id = id;
        this.isNew = isNew;
        this.ticks = ticks;
    }

    public static parse(runtimeInfoString: string): RuntimeInfo {
        if (SF.isEmpty(runtimeInfoString))
            return null;

        var array = runtimeInfoString.split(';');
        return new RuntimeInfo(
            array[0],
            SF.isEmpty(array[1]) ? null : parseInt(array[1]),
            array[2] == "n",
            SF.isEmpty(array[3]) ? null : parseInt(array[3]));
    }

    public toString() {
        return [this.type,
            this.id,
            this.isNew ? "n" : "o",
            this.ticks].join(";");
    }

    public static fromKey(key: string): RuntimeInfo {
        if (SF.isEmpty(key))
            return null;

        return new RuntimeInfo(
            key.before(";"),
            parseInt(key.after(";")),
            false);
    }

    key(): string {
        if (this.id == null)
            throw Error("RuntimeInfo has no Id");

        return this.type + ";" + this.id;
    }


    static getHiddenInput(prefix: string, context?: JQuery) : JQuery {
        var result = $('#' + SF.compose(prefix, Keys.runtimeInfo), context);

        if (result.length != 1)
            throw new Error("{0} elements with id {1} found".format(result.length, SF.compose(prefix, Keys.runtimeInfo)));

        return result; 
    }

    static getFromPrefix(prefix: string, context?: JQuery): RuntimeInfo {
        return RuntimeInfo.parse(RuntimeInfo.getHiddenInput(prefix, context).val());
    }

    static setFromPrefix(prefix: string, runtimeInfo: RuntimeInfo, context?: JQuery) {
        RuntimeInfo.getHiddenInput(prefix, context).val(runtimeInfo == null? "": runtimeInfo.toString());
    }
}

export class EntityValue {
    constructor(runtimeInfo: RuntimeInfo, toString?: string, link?: string) {
        if (runtimeInfo == null)
            throw new Error("runtimeInfo is mandatory for an EntityValue");

        this.runtimeInfo = runtimeInfo;
        this.toStr = toString;
        this.link = link;
    }

    runtimeInfo: RuntimeInfo;
    toStr: string;
    link: string;

    assertPrefixAndType(prefix: string, types: string[]) {
        if (types.length == 0 && types[0] == "[All]")
            return;

        if (types.indexOf(this.runtimeInfo.type) == -1)
            throw new Error("{0} not found in types {1}".format(this.runtimeInfo.type, types.join(", ")));
    }

    isLoaded() {
        return false;
    }
}

export class EntityHtml extends EntityValue {
    prefix: string;
    html: JQuery;

    hasErrors: boolean;

    constructor(prefix: string, runtimeInfo: RuntimeInfo, toString?: string, link?: string) {
        super(runtimeInfo, toString, link);

        if (prefix == null)
            throw new Error("prefix is mandatory for EntityHtml");

        this.prefix = prefix;
    }

    assertPrefixAndType(prefix: string, types: string[]) {

        super.assertPrefixAndType(prefix, types);

        if (this.prefix != null && this.prefix != prefix)
            throw Error("EntityHtml prefix should be {0} instead of  {1}".format(prefix, this.prefix));
    }

    isLoaded() {
        return this.html != null && this.html.length != 0;
    }

    loadHtml(htmlText: string) {
        this.html = $('<div/>').html(htmlText).contents();
    }

    static fromHtml(prefix: string, htmlText: string): EntityHtml {
        var result = new EntityHtml(prefix, new RuntimeInfo("?", null, false));
        result.loadHtml(htmlText);
        return result;
    }

    static fromDiv(prefix: string, div: JQuery): EntityHtml {
        var result = new EntityHtml(prefix, new RuntimeInfo("?", null, false));
        result.html = div.clone();
        return result;
    }

    static withoutType(prefix: string): EntityHtml {
        var result = new EntityHtml(prefix, new RuntimeInfo("?", null, false));
        return result;
    }
}

