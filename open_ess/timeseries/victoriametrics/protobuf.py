"""Minimal protobuf encoder for Prometheus remote write protocol.

Encodes WriteRequest, TimeSeries, Label, and Sample messages without
requiring protoc or the protobuf library. Only supports the specific
wire format needed for remote write.

Protobuf wire format reference:
- Varint: variable-length integer encoding
- Wire type 0: varint (int64)
- Wire type 1: 64-bit fixed (double)
- Wire type 2: length-delimited (string, bytes, embedded message)
"""

import struct


def _encode_varint(value: int) -> bytes:
    """Encode an unsigned integer as a varint."""
    parts = []
    while value > 127:
        parts.append((value & 0x7F) | 0x80)
        value >>= 7
    parts.append(value)
    return bytes(parts)


def _encode_signed_varint(value: int) -> bytes:
    """Encode a signed integer as a varint (two's complement for negatives)."""
    if value < 0:
        value = value + (1 << 64)
    return _encode_varint(value)


def _encode_field(field_number: int, wire_type: int, data: bytes) -> bytes:
    """Encode a field with its tag."""
    tag = (field_number << 3) | wire_type
    return _encode_varint(tag) + data


def _encode_string(field_number: int, value: str) -> bytes:
    """Encode a string field (wire type 2)."""
    encoded = value.encode("utf-8")
    return _encode_field(field_number, 2, _encode_varint(len(encoded)) + encoded)


def _encode_double(field_number: int, value: float) -> bytes:
    """Encode a double field (wire type 1)."""
    return _encode_field(field_number, 1, struct.pack("<d", value))


def _encode_int64(field_number: int, value: int) -> bytes:
    """Encode an int64 field (wire type 0)."""
    return _encode_field(field_number, 0, _encode_signed_varint(value))


def _encode_message(field_number: int, data: bytes) -> bytes:
    """Encode an embedded message field (wire type 2)."""
    return _encode_field(field_number, 2, _encode_varint(len(data)) + data)


def encode_label(name: str, value: str) -> bytes:
    """Encode a Label message.

    message Label {
        string name = 1;
        string value = 2;
    }
    """
    return _encode_string(1, name) + _encode_string(2, value)


def encode_sample(value: float, timestamp_ms: int) -> bytes:
    """Encode a Sample message.

    message Sample {
        double value = 1;
        int64 timestamp = 2;
    }
    """
    return _encode_double(1, value) + _encode_int64(2, timestamp_ms)


def encode_timeseries(labels: list[tuple[str, str]], samples: list[tuple[float, int]]) -> bytes:
    """Encode a TimeSeries message.

    message TimeSeries {
        repeated Label labels = 1;
        repeated Sample samples = 2;
    }

    Args:
        labels: List of (name, value) tuples. Must include ("__name__", metric_name).
                Will be sorted by name as required by the spec.
        samples: List of (value, timestamp_ms) tuples.
    """
    data = b""
    # Labels must be sorted by name
    for label_name, label_value in sorted(labels, key=lambda x: x[0]):
        data += _encode_message(1, encode_label(label_name, label_value))
    for sample_value, timestamp_ms in samples:
        data += _encode_message(2, encode_sample(sample_value, timestamp_ms))
    return data


def encode_write_request(timeseries: list[bytes]) -> bytes:
    """Encode a WriteRequest message.

    message WriteRequest {
        repeated TimeSeries timeseries = 1;
    }

    Args:
        timeseries: List of pre-encoded TimeSeries messages.
    """
    data = b""
    for ts in timeseries:
        data += _encode_message(1, ts)
    return data
