// Import ethers library and contract ABIs
import { ethers } from "./constants/ethers-5.6.esm.min.js"
import {
  abiV1,
  abiV2,
  abiV3,
  contractAddressV1,
  contractAddressV2,
  contractAddressV3,
} from "./constants/ab.js"

// Initialize Ethereum provider
const provider = new ethers.providers.JsonRpcProvider()

// Initialize contracts array
const contracts = [
  { abi: abiV1, address: contractAddressV1 },
  { abi: abiV2, address: contractAddressV2 },
  { abi: abiV3, address: contractAddressV3 },
].map(({ abi, address }) => new ethers.Contract(address, abi, provider))

// DOM elements
const tokenIdInput = document.getElementById("tokenId")
const lib = document.getElementById("lib")
const tknData = document.getElementById("tknData")
const artCode = document.getElementById("artCode")
const panel = document.querySelector(".panel")
const detail = document.getElementById("detail")

// Variables to store contract data
let _tokenId = ""
let _hash = ""
let _script = ""
let _detail = ""
let _codeType = ""

// Function to clear local storage
function clearLocalStorage() {
  localStorage.removeItem("contractData")
  localStorage.removeItem("newSrc")
}

// Function to get and store data from ethereum
async function grabData() {
  _tokenId = tokenIdInput.value
  try {
    clearLocalStorage()

    // Determine contract index based on token ID
    let contractIndex = 0
    if (_tokenId >= 3000000 && _tokenId < 374000000) {
      contractIndex = 1
    } else if (_tokenId >= 374000000) {
      contractIndex = 2
    }
    const contractToUse = contracts[contractIndex]

    // Fetch contract data
    _hash = await (contractIndex === 0
      ? contractToUse.showTokenHashes(_tokenId)
      : contractToUse.tokenIdToHash(_tokenId))

    const projId = await contractToUse.tokenIdToProjectId(_tokenId)
    const projectInfo = await (contractIndex === 2
      ? contractToUse.projectScriptDetails(projId.toString())
      : contractToUse.projectScriptInfo(projId.toString()))

    // Extract library name from _codeType
    _codeType = ""
    if (projectInfo[0].includes("@")) {
      _codeType = projectInfo[0].split("@")[0].trim()
    } else {
      _codeType = JSON.parse(projectInfo[0]).type
    }

    // Construct script
    _script = ""
    for (
      let i = 0;
      i <
      (contractIndex === 2
        ? projectInfo[2].toNumber()
        : projectInfo[1].toNumber());
      i++
    ) {
      const scrpt = await contractToUse.projectScriptByIndex(
        projId.toString(),
        i
      )
      _script += scrpt
    }

    // Fetch project details
    _detail = await contractToUse.projectDetails(projId.toString())

    // Store data in local storage
    localStorage.setItem(
      "contractData",
      JSON.stringify({ _tokenId, _hash, _script, _detail, _codeType })
    )

    // Update library
    updateTag(_codeType)

    location.reload()
  } catch (error) {
    console.error("Error:", error)
  }
}

// Function to update tags
function updateTag(_codeType) {
  const predefinedLibraries = {
    p5js: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
    three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
    processing:
      "https://cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.6/processing.min.js",
    tone: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
    regl: "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.min.js",
  }

  // Update library based on _codeType
  if (predefinedLibraries[_codeType]) {
    lib.src = predefinedLibraries[_codeType]
    localStorage.setItem("newSrc", predefinedLibraries[_codeType])
  } else {
    lib.src = ""
  }

  // Update artCode type
  if (_codeType === "processing") {
    artCode.type = "application/processing"
  }
}

// Function to update UI elements
function updateContent(_tokenId, _hash, _script, _detail, _codeType) {
  tokenIdInput.placeholder = _tokenId

  // Update tknData content
  const tokenData =
    _tokenId < 3000000
      ? `{ tokenId: "${_tokenId}", hashes: ["${_hash}"] };`
      : `{ tokenId: "${_tokenId}", hash: "${_hash}" };`
  tknData.textContent = `let tokenData = ${tokenData}`

  // Update artCode content
  artCode.textContent = _script

  // Update detail content
  if (_detail) {
    detail.innerText = `${_detail[0]} / ${_detail[1]}`
    panel.innerText = _detail[2]
  }
}

// Event listener when the DOM content is loaded
window.addEventListener("DOMContentLoaded", () => {
  lib.src = localStorage.getItem("newSrc")
  // Retrieve data from local storage if available
  const storedData = JSON.parse(localStorage.getItem("contractData"))
  if (storedData) {
    updateContent(...Object.values(storedData))
  }

  console.log("library:", storedData._codeType)
  console.log("library in local storage:", localStorage.getItem("newSrc"))
  console.log("Outer HTML of the script:", lib.outerHTML)
})

tokenIdInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    grabData()
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearLocalStorage()
    location.reload()
  }
})

detail.addEventListener("click", function () {
  panel.classList.toggle("open")
})
