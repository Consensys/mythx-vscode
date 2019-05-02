export const MOCK_ISSUE = `[
    {
      "issues": [
        {
          "swcID": "",
          "swcTitle": "",
          "description": {
            "head": "MythX API Trial Mode.",
            "tail": "You are currently running MythX in Trial mode, which returns a maximum of three vulnerabilities. Sign up for a free account at https://mythx.io to run a complete report."
          },
          "severity": "Low",
          "locations": [],
          "extra": {}
        }
      ],
      "sourceType": "solidity-file",
      "sourceFormat": "text",
      "sourceList": [
        ""
      ],
      "meta": {
        "logs": [
          {
            "level": "error",
            "msg": "Maru:TypeError: this.getContracts(...) is not a function or its return value is not iterable"
          }
        ],
        "selectedCompiler": "Unknown"
      }
    },
    {
      "issues": [
        {
          "swcID": "",
          "swcTitle": "",
          "description": {
            "head": "MythX API Trial Mode.",
            "tail": "You are currently running MythX in Trial mode, which returns a maximum of three vulnerabilities. Sign up for a free account at https://mythx.io to run a complete report."
          },
          "severity": "Low",
          "locations": [],
          "extra": {}
        }
      ],
      "sourceType": "raw-bytecode",
      "sourceFormat": "evm-byzantium-bytecode",
      "sourceList": [
        "0x92e61ae7d4140cd9d2bdbbc5e6801110dca0d81cd51a701b6c90a3a2d42d14f2",
        "0xaf0ab815254e96a3cc504d52d3cfebb2a8d98e02b53cb9e1e3825ca5db712e68"
      ],
      "meta": {
        "coveredInstructions": 273,
        "coveredPaths": 5
      }
    }
  ]`