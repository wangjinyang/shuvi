"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const FileNode_1 = require("./FileNode");
class ModelFile extends FileNode_1.File {
    constructor(name, options) {
        super(name);
        this.name = name;
        this.content = options.content;
        this.template = options.template;
        this.data = options.data;
    }
}
__decorate([
    mobx_1.observable
], ModelFile.prototype, "content", void 0);
__decorate([
    mobx_1.observable
], ModelFile.prototype, "template", void 0);
__decorate([
    mobx_1.observable
], ModelFile.prototype, "data", void 0);
exports.ModelFile = ModelFile;
