"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPTRoles = void 0;
/**
 * Enumeration representing roles for GPT entities.
 */
var GPTRoles;
(function (GPTRoles) {
    /**
     * Role representing a user entity.
     */
    GPTRoles[GPTRoles["USER"] = 'user'] = "USER";
    /**
     * Role representing an assistant entity.
     */
    GPTRoles[GPTRoles["ASSISTANT"] = 'assistant'] = "ASSISTANT";
    /**
     * Role representing a system entity.
     */
    GPTRoles[GPTRoles["SYSTEM"] = 'system'] = "SYSTEM";
})(GPTRoles || (exports.GPTRoles = GPTRoles = {}));
