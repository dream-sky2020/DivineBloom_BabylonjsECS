import { Color3 } from "@babylonjs/core/Maths/math.color";

export const parseColor = (value: string, fallback: Color3) => {
    if (!value) {
        return fallback;
    }
    return Color3.FromHexString(value);
};
