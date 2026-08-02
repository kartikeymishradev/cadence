import numpy as np
import lameenc
import os

sample_rate = 44100
duration_sec = 60 # 60-second seamless looping audio

def encode_to_mp3(pcm_data, filename, sample_rate=44100, num_channels=2):
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(192)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(num_channels)
    encoder.set_quality(2) # 2 = High Quality
    
    pcm_bytes = pcm_data.astype(np.int16).tobytes()
    mp3_data = encoder.encode(pcm_bytes)
    mp3_data += encoder.flush()
    
    with open(filename, 'wb') as f:
        f.write(mp3_data)
    print(f'Successfully generated: {filename} ({len(mp3_data)} bytes)')

# 1. White Noise
np.random.seed(42)
num_samples = sample_rate * duration_sec
white = np.random.normal(0, 0.2, num_samples)
white_stereo = np.column_stack((white, np.random.normal(0, 0.2, num_samples)))
white_pcm = (white_stereo * 32767).astype(np.int16)

# 2. Brown Noise
b_left = np.zeros(num_samples)
b_right = np.zeros(num_samples)
val_l, val_r = 0.0, 0.0
w_l = np.random.normal(0, 1, num_samples)
w_r = np.random.normal(0, 1, num_samples)

for i in range(num_samples):
    val_l = 0.98 * val_l + 0.05 * w_l[i]
    val_r = 0.98 * val_r + 0.05 * w_r[i]
    b_left[i] = val_l
    b_right[i] = val_r

# Normalize brown noise
b_left = b_left / (np.max(np.abs(b_left)) + 1e-6) * 0.4
b_right = b_right / (np.max(np.abs(b_right)) + 1e-6) * 0.4
brown_stereo = np.column_stack((b_left, b_right))
brown_pcm = (brown_stereo * 32767).astype(np.int16)

# 3. 40Hz Pulsed Tone (Binaural offset + 40Hz pulse modulation)
t = np.linspace(0, duration_sec, num_samples, endpoint=False)
carrier_left = np.sin(2 * np.pi * 200 * t) * 0.25
carrier_right = np.sin(2 * np.pi * 240 * t) * 0.25 # 240 - 200 = 40Hz channel offset

iso_pulse = 0.5 * (1 + np.sin(2 * np.pi * 40 * t - np.pi/2))
warm_bg = b_left * 0.3 * iso_pulse

gamma_left = carrier_left + warm_bg
gamma_right = carrier_right + warm_bg
gamma_left = gamma_left / (np.max(np.abs(gamma_left)) + 1e-6) * 0.5
gamma_right = gamma_right / (np.max(np.abs(gamma_right)) + 1e-6) * 0.5

gamma_stereo = np.column_stack((gamma_left, gamma_right))
gamma_pcm = (gamma_stereo * 32767).astype(np.int16)

pub_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'audio')
os.makedirs(pub_dir, exist_ok=True)

encode_to_mp3(white_pcm, os.path.join(pub_dir, 'white_noise.mp3'))
encode_to_mp3(brown_pcm, os.path.join(pub_dir, 'brown_noise.mp3'))
encode_to_mp3(gamma_pcm, os.path.join(pub_dir, 'gamma_wave.mp3'))
