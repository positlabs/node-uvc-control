#!/usr/bin/env node

/*
	List available controls
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


	Need to read bmControls from Camera Terminal Descriptor
	Table 3-6 Camera Terminal Descriptor

	VC Interface Descriptor is a concatenation of all the descriptors that are used to fully describe 
	the video function, i.e., all Unit Descriptors (UDs) and Terminal Descriptors (TDs)

	TODO 

	also need to find the processing unit descriptor!!!

*/

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

// 'brightness',
// 'contrast',
// 'saturation',
// 'sharpness',
// 'whiteBalanceTemperature',
// 'backlightCompensation',
// 'gain',
// 'autoWhiteBalance',

const UVCControl = require('../index');
const cam = new UVCControl();

const getSupportedControls = () => {

	// find the VC interface
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
		// let obj = {
		// 	bLength,
		// 	bDescriptorType: arr[1],
		// 	bDescriptorSubType: arr[2],
		// 	//...
		// }
		// 
	}
	let bmControlsBitmap
	descriptorArrays.forEach(arr => {
		// find the camera input terminal descriptor
		if(arr[0] === 0x12 && arr[1] === 0x24 && arr[2] === 0x02) {
			// convert hex to bitmap to string
			const bmControlsHex = arr.splice(15, 3)
				.map(i => i.toString(16).padStart(2, 0))
				.reduce((a, b) => a + b)
			bmControlsBitmap = hex2bin(bmControlsHex).toString()
		}
	})

	// filter control keys according to the bitmap
	// TODO filter keys based on what controls are actually implemented
	return inputControlsKeyMap.filter((k, i) => parseInt(bmControlsBitmap[i]) === 1)
}

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

console.log(getSupportedControls())

// UVCControl.controls.map(name => {
// 	cam.get(name, (err, val) => {
// 		if(err) throw err;
// 		// console.log(name, val);
// 		console.log(name)
// 	});
// });
