Delete this link at the end of the specification process:  
- [Roadmap to Specification](../../issues/1)

# Accessport2LtpTranslator

## Location

The Accessport2LtpTranslator is part of the HighPerformanceNetworkInterface.

## Description

The Accessport2LtpTranslator is supporting for instance the Resolver in creating a valid RESTCONF URI.
In order to compare planning data and system settings as well as performance data, it should be possible to establish standardised relationships between the SDN models and current planning tools.
Therefore the attribute sequenceID should be used.
Each object (connector and contained-holder) beneath an common equipment object should have a unique sequenceId.
Accessport2LtpTranslator is translating the given sequenceId values (for instance from a legacy tool like x:akta or APT) into the UUID of a LTP.
The relevant data is collected on demand when the requestor is calling the /v1/translate-equipment-to-ltp.
The input parameters should be handed over via request body.
The data is retrieved from the MicrowaveDeviceInventory from cache.

- Concrete translation results are provided on individual service requests.
- Potential format of the response
  ````
  {
    [
      {
        "uuid": "“ETY-2134639620“",
        "client-ltp": "“PES-2134639620“",
        "server-ltp": null,
        "layer-protocol-name": "„wire-interface-2-0…“"
      },
      {
        "uuid": "“PES-2134639620“",
        "client-ltp": "“ETC-2134639620“",
        "server-ltp": ETY-2134639620,
        "layer-protocol-name": "„pure-ethenet-structur-2-0…“"
      },

    ]
  }
  ````

## Relevance

The Accessport2LtpTranslator serves as a "phone book". 
Other applications require it for addressing live network resources.

## Resources

- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Dependencies

- [MicroWaveDeviceInventory](https://github.com/openBackhaul/MicroWaveDeviceInventory)

### Comments

This application will be specified during [training for ApplicationOwners](https://gist.github.com/openBackhaul/5aabdbc90257b83b9fe7fc4da059d3cd).
