import * as client from './client/controller';

export const DEFAULT_TREATMENT_PLAN: client.BaseJob['treatmentPlan'] = {
    type: 'pro',
    detail: {
        plan: {
            tens: 0,
            ultrasound: 0,
        },
        ultrasoundSetting: {
            scheme: '1mContinuous',
            intensityLimit: {
                oneMC: 1.0,
                threeMC: 1.0,
                oneMP: 1.0,
                threeMP: 1.0,
            },
            pulseDutyRatio: {
                oneM: '1:1',
                threeM: '1:1',
            },
            pulseFrequencyInHz: {
                oneM: 1,
                threeM: 1,
            },
            temperatureThreshold: 3,
        },
        tensSetting: {
            waveform: 1,
            channel: {
                ch1: true,
                ch2: true,
                ch3: true,
                ch4: true,
            },
            intensitylimit: {
                ch1: 0,
                ch2: 0,
                ch3: 0,
                ch4: 0,
            },
            heatLimit: {
                ch1: 0,
                ch2: 0,
            },
        },
    },
};

export function createTreatmentSnapshot(treatmentPlan: client.BaseJob['treatmentPlan'] = DEFAULT_TREATMENT_PLAN): client.TreatmentSnapshot {
    const snapshot: client.TreatmentSnapshot = {
        type: 'pro',
        detail: {
            plan: {
                tens: treatmentPlan.detail.plan.tens,
                ultrasound: treatmentPlan.detail.plan.ultrasound,
            },
            ultrasoundSnapshot: {
                pulseFrequencyInHz: 1,
                pulseDutyRatio: '1:1',
                temperature: treatmentPlan.detail.ultrasoundSetting.temperatureThreshold,
                scheme: treatmentPlan.detail.ultrasoundSetting.scheme,
                intensity: 1,
                time: {
                    startedAt: new Date().toISOString(),
                    timeRemain: {
                        unit: 'minute',
                        value: 10,
                    },
                },
            },
            tensSnapshot: {
                intensity: {
                    ch1: treatmentPlan.detail.tensSetting.intensitylimit.ch1,
                    ch2: treatmentPlan.detail.tensSetting.intensitylimit.ch2,
                    ch3: treatmentPlan.detail.tensSetting.intensitylimit.ch3,
                    ch4: treatmentPlan.detail.tensSetting.intensitylimit.ch4,
                },
                temperature: {
                    ch1: 0,
                    ch2: 0,
                },
                waveform: treatmentPlan.detail.tensSetting.waveform,
                time: {
                    startedAt: new Date().toISOString(),
                    timeRemain: {
                        unit: 'minute',
                        value: 10,
                    },
                },
            },
        },
    };
    console.log(`Created treatment snapshot ${JSON.stringify(snapshot)}`);
    return snapshot;
}
