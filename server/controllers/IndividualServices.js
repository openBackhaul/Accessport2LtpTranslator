'use strict';

const executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const IndividualServices = require('../service/IndividualServicesService');
const responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
const createHttpError = require("http-errors");
const OnfAttributeFormatter = require("onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter");

module.exports.bequeathYourDataAndDie = function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();

  IndividualServices.bequeathYourDataAndDie(req.url, body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(async function (response) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let responseCode = responseCodeEnum.code.NO_CONTENT;
      let responseBody = response;
      responseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
    })
    .catch(async function (response) {
      let responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let responseBody = response;
      responseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
    });
};

function buildErrorResponse(response, responseCode, responseBody, responseHeader, message, code) {
    if (createHttpError.isHttpError(responseBody)) {
        responseCode = responseBody.statusCode;
        responseBody = {
            code: responseCode,
            message: responseBody.message,
        }
    } else if (responseCode == undefined || responseCode == 500) {
        responseCode = 500;
        responseBody = {
            code: responseCode,
            message: message ? message : createHttpError.InternalServerError().message
        }
    } else {
        responseCode = code ? code : 500;
        responseBody = {
            code: responseCode,
            message: message ? message : createHttpError.InternalServerError().message
        }
    }
    let headers = undefined;
    if (responseHeader != undefined) {
        headers = OnfAttributeFormatter.modifyJsonObjectKeysToKebabCase(responseHeader);
        response.set(headers);
    }
    response.status(responseCode).json(responseBody);
}

module.exports.translateEquipmentSequenceIdsToLtpUuids = function translateEquipmentSequenceIdsToLtpUuids (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();

  IndividualServices.translateEquipmentSequenceIdsToLtpUuids(req.url, body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(async function (response) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let responseCode = responseCodeEnum.code.OK;
      let responseBody = response;
      responseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
    })
    .catch(async function (response) {
      let responseCode = response.http_status;
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let responseBody = response;
      buildErrorResponse(res, responseCode, responseBody, responseHeader, response.message, response.http_status);
      executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
    });
};

// 4-integrate-logging

// 7-implement-individual-services
