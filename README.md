# AccessportToLtpTranslator (ATLT)

### Location  
The AccessportToLtpTranslator (ATLT) is part of the HighPerformanceNetworkInterface.

### Description  
It is supporting other applications or legacy tools in creating valid RESTCONF URIs.  
The ATLT is translating port identifiers as they are prevalent in the planning tools into UUIDs of LogicalTerminationPoints as they are used on the harmonized management interface.

### Relevance
The AccessportToLtpTranslator serves as a "phone book". 
Other applications require it for addressing live network resources.

### Resources
- [Specification](./spec/)
- [TestSuite](./testing/)
- [Implementation](./server/)

### Dependencies
- [MicroWaveDeviceInventory](https://github.com/openBackhaul/MicroWaveDeviceInventory)
- The sequence-id attribute needs to be supported by the vendors.

### Latest Update

The v1.0.2 release adds the following specification changes:  
- update the specification to use the new ApplicationPattern release 2.1.2
- operation client update for MWDI to the latest MWDI spec version 1.2.0

There were no additions or changes to individual services.  

### Comments
./.
