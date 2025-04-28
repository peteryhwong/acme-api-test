import * as client from './client/controller';

export const DEFAULT_TREATMENT_PLAN: client.BaseJob['treatmentPlan'] = {
    type: 'pro',
    detail: {
        plan: {
            ultrasound0Tens30: true,
            ultrasound10Tens20: true,
            ultrasound20Tens10: true,
            ultrasound30Tens0: true,
        },
        ultrasoundSetting: {
            scheme: {
                oneMContinuous: true,
                oneMPulse: true,
                threeMContinuous: true,
                threeMPulse: true,
            },
            intensityLimit: {
                oneMC: 10,
                threeMC: 10,
                oneMP: 10,
                threeMP: 10,
            },
            pulseDutyRatio: {
                oneM: 0,
                threeM: 0,
            },
            pulseFrequencyInHz: {
                oneM: 1,
                threeM: 1,
            },
            temperatureThreshold: 2,
        },
        tensSetting: {
            waveform: {
                wf1: true,
                wf2: true,
                wf3: true,
                wf4: true,
                wf5: true,
                wf6: true,
            },
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
            plan: 'ultrasound0Tens30',
            ultrasoundSnapshot: {
                pulseFrequencyInHz: 1,
                pulseDutyRatio: 0,
                temperature: treatmentPlan.detail.ultrasoundSetting.temperatureThreshold,
                scheme: 'oneMContinuous',
                intensity: 9,
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
                waveform: 'wf1',
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
