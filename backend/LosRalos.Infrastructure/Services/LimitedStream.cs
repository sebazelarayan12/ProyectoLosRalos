namespace LosRalos.Infrastructure.Services;

public sealed class LimitedStream(Stream inner, long maxBytes) : Stream
{
    private long _totalRead;

    public override bool CanRead => true;
    public override bool CanSeek => false;
    public override bool CanWrite => false;
    public override long Length => throw new NotSupportedException();
    public override long Position
    {
        get => throw new NotSupportedException();
        set => throw new NotSupportedException();
    }

    public override int Read(byte[] buffer, int offset, int count)
    {
        var read = inner.Read(buffer, offset, count);
        _totalRead += read;
        if (_totalRead > maxBytes)
            throw new IOException($"El archivo supera el tamanio maximo permitido de {maxBytes} bytes.");
        return read;
    }

    public override async Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
    {
        var read = await inner.ReadAsync(buffer.AsMemory(offset, count), cancellationToken).ConfigureAwait(false);
        _totalRead += read;
        if (_totalRead > maxBytes)
            throw new IOException($"El archivo supera el tamanio maximo permitido de {maxBytes} bytes.");
        return read;
    }

    public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
    {
        var read = await inner.ReadAsync(buffer, cancellationToken).ConfigureAwait(false);
        _totalRead += read;
        if (_totalRead > maxBytes)
            throw new IOException($"El archivo supera el tamanio maximo permitido de {maxBytes} bytes.");
        return read;
    }

    public override void Flush() => inner.Flush();
    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

    protected override void Dispose(bool disposing)
    {
        if (disposing) inner.Dispose();
        base.Dispose(disposing);
    }
}
