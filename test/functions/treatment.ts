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
            intensityLimit: 1.0,
            pulseFrequencyInHz: 10,
            pulseDutyRatio: {
                numerator: 10,
                denominator: 10,
            },
            temperatureThreshold: 3,
        },
        tensSetting: {
            waveform: 1,
            channel: 1,
            intensitylimit: {
                ch1: 0,
                ch2: 0,
                ch3: 0,
                ch4: 0,
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
                pulseFrequencyInHz: treatmentPlan.detail.ultrasoundSetting.pulseFrequencyInHz,
                pulseDutyRatio: {
                    numerator: treatmentPlan.detail.ultrasoundSetting.pulseDutyRatio.numerator ?? 0,
                    denominator: treatmentPlan.detail.ultrasoundSetting.pulseDutyRatio.denominator ?? 1,
                },
                temperature: treatmentPlan.detail.ultrasoundSetting.temperatureThreshold,
                scheme: treatmentPlan.detail.ultrasoundSetting.scheme,
                intensity: treatmentPlan.detail.ultrasoundSetting.intensityLimit,
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
                    ch3: 0,
                    ch4: 0,
                },
                waveform: treatmentPlan.detail.tensSetting.waveform,
                channel: treatmentPlan.detail.tensSetting.channel,
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
