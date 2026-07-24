export interface MediaDevice {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
}

export type MediaDeviceKind = 'videoinput' | 'audioinput' | 'audiooutput';

export interface MediaStreamConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export interface MediaTrackConstraints {
  width?: number | ConstrainULong;
  height?: number | ConstrainULong;
  facingMode?: string | ConstrainDOMString;
  deviceId?: string | ConstrainDOMString;
  groupId?: string | ConstrainDOMString;
  frameRate?: number | ConstrainDouble;
  aspectRatio?: number | ConstrainDouble;
  sampleRate?: number | ConstrainULong;
  sampleSize?: number | ConstrainULong;
  echoCancellation?: boolean | ConstrainBoolean;
  noiseSuppression?: boolean | ConstrainBoolean;
  autoGainControl?: boolean | ConstrainBoolean;
}

export interface CameraCapabilities {
  width: { min: number; max: number; step: number };
  height: { min: number; max: number; step: number };
  aspectRatio: { min: number; max: number; step: number };
  frameRate: { min: number; max: number; step: number };
  facingMode: string[];
}

export interface CameraInfo {
  deviceId: string;
  label: string;
  capabilities?: CameraCapabilities;
  kind: 'videoinput';
}

export interface MediaDevicesInfo {
  videoInputs: CameraInfo[];
  audioInputs: MediaDevice[];
  audioOutputs: MediaDevice[];
}
