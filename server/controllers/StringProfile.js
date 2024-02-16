'use strict';

const StringProfile = require('../service/StringProfileService');
const logger = require('../service/LoggingService.js').getLogger();
const responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');


module.exports.getStringProfileStringName = async function getStringProfileStringName(req, res, next) {
  let responseCode = responseCodeEnum.code.OK;
  // forward requ.url including the uuid parameter
  await StringProfile.getStringProfileStringName(req.url)
    .then(function (response) {
      logger.debug("getStringProfileStringName: " + req.url + " / " + JSON.stringify(response));
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfileStringName: " + res);
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getStringProfileEnumeration = async function getStringProfileEnumeration(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfileEnumeration(req.url)
    .then(function (response) {
      logger.debug("getStringProfileEnumeration: " + req.url + " / " + JSON.stringify(response));
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfileEnumeration: " + res);
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getStringProfilePattern = async function getStringProfilePattern(req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfilePattern(req.url)
    .then(function (response) {
      logger.debug("getStringProfilePattern: " + req.url + " / " + JSON.stringify(response));
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfilePattern: " + res);
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getStringProfileStringValue = async function getStringProfileStringValue(req, res, next) {
  let responseCode = responseCodeEnum.code.OK;
  await StringProfile.getStringProfileStringValue(req.url)
    .then(function (response) {
      logger.debug("getStringProfileStringValue: " + req.url + " / " + JSON.stringify(response));
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in getStringProfileStringValue: " + res);
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putStringProfileStringValue = async function putStringProfileStringValue(req, res, next, body) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  await StringProfile.putStringProfileStringValue(body, req.url)
    .then(function (response) {
      logger.debug("putStringProfileStringValue: " + req.url + " / " + JSON.stringify(response));
      responseBuilder.buildResponse(res, responseCode, response);
    })
    .catch(function (response) {
      logger.error(response, "Exception in putStringProfileStringValue: " + res);
      let sentResp = responseBuilder.buildResponse(res, undefined, response);
      responseCode = sentResp.code;
    });
  oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
