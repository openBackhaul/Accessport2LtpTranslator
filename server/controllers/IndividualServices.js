'use strict';

var executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
var IndividualServices = require('../service/IndividualServicesService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');

module.exports.bequeathYourDataAndDie = function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();

  IndividualServices.bequeathYourDataAndDie(req.url, body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(async function (response) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let responseCode = response.code;
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

module.exports.translateEquipmentSequenceIdsToLtpUuids = function translateEquipmentSequenceIdsToLtpUuids (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();

  IndividualServices.translateEquipmentSequenceIdsToLtpUuids(req.url, body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(async function (response) {
      let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let responseCode = response.code;
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

// 4-integrate-logging

// 7-implement-individual-services
