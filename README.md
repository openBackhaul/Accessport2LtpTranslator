Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# Accessport2LtpTranslator

### Location
The Accessport2LtpTranslator is part of the HighPerformanceNetworkInterface.

### Description
_Copy from Roadmap:_  
The Accessport2LtpTranslator is supporting e.g. the Resolver in creating a valid RESTCONF URI. It is translating the access port identified from within x:akta plus a given protocol layer name into the UUID of an LTP, which is associated with the corresponding Connector object on the ONF interface. Accessport2LtpTranslator is continuously going through the MicroWaveDeviceInventory and updating its internal translation table. Concrete translation results are provided on individual service requests.  
_Original text:_  
- The Accessport2LtpTranslator is supporting e.g. the Resolver in creating a valid RESTCONF URI. 
- It is translating the access port identified from within x:akta plus a given protocol layer name into the UUID of an LTP, which is associated with the corresponding Connector object on the ONF interface. **Update on 30th of September 2022**: During ApplicationOwner call, it has been discussed to return [LtpUuid, LayerProtocolName, Clients, Server] of the entire stack of LTPs on top of a physical connector. 
- Accessport2LtpTranslator is continuously going through the MicroWaveDeviceInventory and updating its internal translation table. **Update on 30th of September 2022**: It has been decided not to maintain an internal data store of translation results, but to calculate them on demand.
- Concrete translation results are provided on individual service requests.
- Potential format of the response 
  ````
  {
    [
      {
        ownUuid,
        layerProtocolName,
        clientLtpUuid [ ],
        serverLtpUuid [ ],
      }
    ]
  }
  ````

### Relevance
The Accessport2LtpTranslator serves as a "phone book". 
Other applications require it for addressing live network resources.

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Comments
This application will be specified during training for ApplicationOwner.
