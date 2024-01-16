'use strict';


/**
 * Returns the enumeration values of the String
 *
 * uuid String 
 **/
exports.getStringProfileEnumeration = function(uuid) {
  return {
    "string-profile-1-0:enumeration" : [ "string-profile-1-0:STRING_VALUE_TYPE_REACTIVE", "string-profile-1-0:STRING_VALUE_TYPE_PROTECTION", "string-profile-1-0:STRING_VALUE_TYPE_OFF" ]
  };
}


/**
 * Returns the pattern of the String
 *
 * uuid String 
 **/
exports.getStringProfilePattern = function(uuid) {
  return {
    "string-profile-1-0:pattern" : "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
  };
}


/**
 * Returns the name of the String
 *
 * uuid String 
 **/
exports.getStringProfileStringName = function(uuid) {
  return {
    "string-profile-1-0:string-name" : "operationMode"
  };
}


/**
 * Returns the configured value of the String
 *
 * uuid String 
 **/
exports.getStringProfileStringValue = function(uuid) {
  return {
    "string-profile-1-0:string-value" : "string-profile-1-0:STRING_VALUE_TYPE_OFF"//TODO
  };
}


/**
 * Configures value of the String
 *
 * body Stringprofileconfiguration_stringvalue_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putStringProfileStringValue = function(body,uuid) {
  //TODO
  return new Promise(function(resolve, reject) {
    resolve();
  });
}
