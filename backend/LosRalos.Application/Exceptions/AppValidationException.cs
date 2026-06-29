namespace LosRalos.Application.Exceptions;

public class AppValidationException : Exception
{
    public Dictionary<string, string> Errors { get; }

    public AppValidationException(string message, Dictionary<string, string> errors)
        : base(message)
    {
        Errors = errors;
    }

    public AppValidationException(string field, string error)
        : base(error)
    {
        Errors = new Dictionary<string, string> { [field] = error };
    }
}
