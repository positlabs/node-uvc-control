#!/usr/bin/env node

/*
	List available controls. 
	Passing list-all will show unimplemented, but available controls.

	Usage: 
		./get-supported-controls.js 
		./get-supported-controls.js list-all

	Input controls
	===============
	D0: Scanning Mode
	D1: Auto-Exposure Mode
	D2: Auto-Exposure Priority
	D3: Exposure Time (Absolute)
	D4: Exposure Time (Relative)
	D5: Focus (Absolute)
	D6: Focus (Relative)
	D7: Iris (Absolute)
	D8: Iris (Relative)
	D9: Zoom (Absolute)
	D10: Zoom (Relative)
	D11: PanTilt (Absolute)
	D12: PanTilt (Relative)
	D13: Roll (Absolute)
	D14: Roll (Relative)
	D15: Reserved
	D16: Reserved
	D17: Focus, Auto
	D18: Privacy
	D19: Focus, Simple
	D20: Window
	D21: Region of Interest
	D22 – D23: Reserved, set to zero

	Processing unit controls
	===============
	D0: Brightness
	D1: Contrast
	D2: Hue
	D3: Saturation
	D4: Sharpness
	D5: Gamma
	D6: White Balance Temperature
	D7: White Balance Component
	D8: Backlight Compensation
	D9: Gain
	D10: Power Line Frequency
	D11: Hue, Auto
	D12: White Balance Temperature, Auto
	D13: White Balance Component, Auto
	D14: Digital Multiplier
	D15: Digital Multiplier Limit
	D16: Analog Video Standard
	D17: Analog Video Lock Status
	D18: Contrast, Auto
	D19 – D23: Reserved. Set to zero.
*/

const listAll = process.argv[2] === 'list-all'

const inputControlsKeyMap = [
	'scanningMode',
	'autoExposureMode',
	'autoExposurePriority',
	'absoluteExposureTime',
	'relativeExposureTime',
	'absoluteFocus',
	'relativeFocus',
	'absoluteIris',
	'relativeIris',
	'absoluteZoom',
	'relativeZoom',
	'absolutePanTilt',
	'relativePanTilt',
	'absoluteRoll',
	'relativeRoll',
	null,
	null,
	'autoFocus',
	'privacy',
	'simpleFocus',
	'window',
	'regionOfInterest',
	null,
	null,
]

const processingControlsKeyMap = [
	'brightness',
	'contrast',
	'hue',
	'saturation',
	'sharpness',
	'gamma',
	'whiteBalance',
	'whiteBalanceComponent',
	'backlightCompensation',
	'gain',
	'powerLineFrequency',
	'autoHue',
	'autoWhiteBalance',
	'autoWhiteBalanceComponent',
	'digitalMultiplier',
	'digitalMultiplierLimit',
	'analogVideoStandard',
	'analogVideoLockStatus',
	'autoContrast',
	null, 
	null, 
	null, 
	null, 
	null
]

const UVCControl = require('../index');
const cam = new UVCControl();

/**
 * 
 * @param {Boolean} listAll - list all controls, including unimplemented ones
 * @return {Array} - list of supported control keys
 */
const getSupportedControls = (listAll) => {

	// find the VC interface
	// VC Interface Descriptor is a concatenation of all the descriptors that are used to fully describe 
	// the video function, i.e., all Unit Descriptors (UDs) and Terminal Descriptors (TDs)
	const vcInterface = cam.device.interfaces.filter(interface => {
		const {descriptor} = interface
		return descriptor.bInterfaceNumber === 0x00
			&& descriptor.bInterfaceClass === 0x0e
			&& descriptor.bInterfaceSubClass === 0x01
	})[0]

	// parse the descriptors in the extra field
	let data = vcInterface.descriptor.extra.toJSON().data
	let descriptorArrays = []
	while(data.length){
		let bLength = data[0]
		let arr = data.splice(0, bLength)
		descriptorArrays.push(arr)
	}
	let iCbmControlsBitmap, 
		pUbmControlsBitmap
	descriptorArrays.forEach(arr => {
		// find the camera input terminal descriptor
		// NOTE not confident in this, but it seems to work
		if(arr[0] === 0x12 && arr[1] === 0x24 && arr[2] === 0x02) {
			// convert hex to bitmap to string
			let bControlSize = arr[14]
			const iCbmControlsHex = arr.splice(15, bControlSize)
				.map(i => i.toString(16).padStart(2, 0))
				.reduce((a, b) => a + b)
			iCbmControlsBitmap = hex2bin(iCbmControlsHex).toString()
		}else if(arr[0] === 0x0B && arr[1] === 0x24 && arr[2] === 0x05) {
			// find the processing unit descriptor
			let bControlSize = arr[7]
			const pUbmControlsHex = arr.splice(8, bControlSize)
				.map(i => i.toString(16).padStart(2, 0))
				.reduce((a, b) => a + b)
			pUbmControlsBitmap = hex2bin(pUbmControlsHex).toString()
		}
	})

	// console.log(iCbmControlsBitmap)
	// console.log(pUbmControlsBitmap)

	// filter control keys according to the bitmap
	const supportedInputControls = inputControlsKeyMap.filter((k, i) => parseInt(iCbmControlsBitmap[i]) === 1)
	const supportedProcessingUnitControls = processingControlsKeyMap.filter((k, i) => parseInt(pUbmControlsBitmap[i]) === 1)
	let output = [].concat(supportedInputControls)
		.concat(supportedProcessingUnitControls)

	// filter keys based on which controls are actually implemented
	if(!listAll){
		output = output.filter(i => {
			return UVCControl.controls.indexOf(i) !== -1
		})
	}
	return output
}

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

console.log(getSupportedControls(listAll))
